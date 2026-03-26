import logging
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_
from decimal import Decimal
import uuid
from datetime import datetime
from typing import List

from app.database import get_db
from app.models import Bet, PlayerStats
from app.schemas import (
    PlaceBetRequest,
    ResolveRoundRequest,
    BetResponse,
    RoundResultResponse,
    ActiveBetResponse,
    PlayerStatsResponse,
    BetHistoryResponse,
)
from app.services.bet_engine import (
    get_current_price,
    resolve_round,
    calculate_final_payout_with_streak,
    calculate_xp,
)

router = APIRouter(prefix="/api/bet", tags=["orbitbet"])
logger = logging.getLogger(__name__)


async def get_or_create_stats(db: AsyncSession, user_id: uuid.UUID) -> PlayerStats:
    """Get or create player stats."""
    query = await db.execute(select(PlayerStats).where(PlayerStats.user_id == user_id))
    stats = query.scalar_one_or_none()
    if not stats:
        stats = PlayerStats(user_id=user_id)
        db.add(stats)
        await db.flush()
    return stats


@router.post("/place", response_model=BetResponse)
async def place_bet(
    request: PlaceBetRequest,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(...)
):
    """Place a new bet."""
    try:
        logger.info(f"Place bet request: {request}")
        
        user_uuid = uuid.UUID(x_user_id)
        
        # Validate stake
        if request.stake < Decimal("10.00"):
            raise HTTPException(status_code=400, detail="Minimum stake is R10")
        if request.stake > Decimal("10000.00"):
            raise HTTPException(status_code=400, detail="Maximum stake is R10,000")
        
        # Check for existing active bet
        existing_query = await db.execute(
            select(Bet).where(
                and_(Bet.user_id == user_uuid, Bet.status == "ACTIVE")
            )
        )
        existing_bet = existing_query.scalar_one_or_none()
        if existing_bet:
            raise HTTPException(status_code=400, detail="You already have an active bet")
        
        # Get current price
        current_price = await get_current_price(request.symbol, test_mode=True)
        logger.info(f"Current price for {request.symbol}: {current_price}")
        
        # Get or create stats
        stats = await get_or_create_stats(db, user_uuid)
        
        # Create bet
        bet = Bet(
            user_id=user_uuid,
            symbol=request.symbol,
            direction=request.direction.upper(),
            stake=request.stake,
            multiplier=Decimal("1.85"),
            current_step=0,
            round_1_price=Decimal(str(current_price)),
            status="ACTIVE"
        )
        db.add(bet)
        await db.commit()
        await db.refresh(bet)
        
        return BetResponse(
            bet_id=bet.id,
            step=bet.current_step,
            status=bet.status,
            round_number=1,
            message="Round 1 ready - choose UP or DOWN",
            stake=float(bet.stake),
            symbol=bet.symbol
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in place_bet: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/round", response_model=RoundResultResponse)
async def resolve_round_endpoint(
    request: ResolveRoundRequest,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(...)
):
    """Resolve a single round."""
    try:
        user_uuid = uuid.UUID(x_user_id)
        
        bet_query = await db.execute(select(Bet).where(Bet.id == request.bet_id))
        bet = bet_query.scalar_one_or_none()
        
        if not bet:
            raise HTTPException(status_code=404, detail="Bet not found")
        if bet.user_id != user_uuid:
            raise HTTPException(status_code=403, detail="Not your bet")
        if bet.status != "ACTIVE":
            raise HTTPException(status_code=400, detail="Bet already completed")
        
        current_round = bet.current_step + 1
        
        if current_round > 3:
            raise HTTPException(status_code=400, detail="Bet already completed")
        
        current_price = await get_current_price(bet.symbol, test_mode=True)
        
        if current_round == 1:
            entry_price = bet.round_1_price
        elif current_round == 2:
            entry_price = bet.round_2_price
        else:
            entry_price = bet.round_3_price
        
        if entry_price is None:
            raise HTTPException(status_code=400, detail="Round entry price not found")
        
        round_result = resolve_round(
            request.chosen_direction,
            float(entry_price),
            current_price
        )
        
        price_movement = ((current_price - float(entry_price)) / float(entry_price)) * 100
        
        if current_round == 1:
            bet.round_1 = round_result
            bet.round_1_exit_price = Decimal(str(current_price))
            bet.round_2_price = Decimal(str(current_price))
        elif current_round == 2:
            bet.round_2 = round_result
            bet.round_2_exit_price = Decimal(str(current_price))
            bet.round_3_price = Decimal(str(current_price))
        else:
            bet.round_3 = round_result
            bet.round_3_exit_price = Decimal(str(current_price))
            bet.resolved_at = datetime.utcnow()
        
        bet.current_step = current_round
        bet.last_step_at = datetime.utcnow()
        
        await db.flush()
        
        is_complete = current_round == 3
        final_result = None
        payout = None
        streak_stats = None
        
        if is_complete:
            outcomes = [bet.round_1, bet.round_2, bet.round_3]
            wins = outcomes.count("WIN")
            
            stats = await get_or_create_stats(db, user_uuid)
            stats.total_bets += 1
            stats.total_volume += bet.stake
            
            if wins >= 2:
                bet.status = "WON"
                final_result = "WIN"
                
                payout = calculate_final_payout_with_streak(bet.stake, stats.win_streak)
                bet.payout = payout
                
                stats.record_win(float(payout))
                xp_gained = calculate_xp(True, stats.win_streak)
                stats.add_xp(xp_gained)
                
                streak_stats = {
                    "win_streak": stats.win_streak,
                    "best_win_streak": stats.best_win_streak,
                    "total_wins": stats.total_wins,
                    "xp_gained": xp_gained,
                    "level": stats.level
                }
            else:
                bet.status = "LOST"
                final_result = "LOSS"
                
                stats.record_loss()
                xp_gained = calculate_xp(False, 0)
                stats.add_xp(xp_gained)
                
                streak_stats = {
                    "win_streak": 0,
                    "total_losses": stats.total_losses,
                    "xp_gained": xp_gained,
                    "level": stats.level
                }
            
            stats.last_played = datetime.utcnow()
            await db.flush()
        
        await db.commit()
        
        next_round = current_round + 1 if not is_complete else None
        
        return RoundResultResponse(
            bet_id=bet.id,
            round_number=current_round,
            result=round_result,
            entry_price=float(entry_price),
            exit_price=current_price,
            price_movement=round(price_movement, 4),
            next_round=next_round,
            is_complete=is_complete,
            final_result=final_result,
            payout=float(payout) if payout else None,
            streak_stats=streak_stats
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in resolve_round: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/active", response_model=ActiveBetResponse)
async def get_active_bet(
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(...)
):
    """Get active bet."""
    try:
        user_uuid = uuid.UUID(x_user_id)
        
        query = await db.execute(
            select(Bet).where(
                and_(Bet.user_id == user_uuid, Bet.status == "ACTIVE")
            ).order_by(desc(Bet.created_at))
        )
        bet = query.scalar_one_or_none()
        
        if not bet:
            return ActiveBetResponse(has_active_bet=False)
        
        current_round = bet.current_step + 1
        
        if current_round == 1:
            entry_price = float(bet.round_1_price) if bet.round_1_price else None
        elif current_round == 2:
            entry_price = float(bet.round_2_price) if bet.round_2_price else None
        else:
            entry_price = float(bet.round_3_price) if bet.round_3_price else None
        
        return ActiveBetResponse(
            has_active_bet=True,
            bet_id=bet.id,
            symbol=bet.symbol,
            stake=float(bet.stake),
            current_round=current_round,
            entry_price=entry_price,
            round_1_result=bet.round_1,
            round_2_result=bet.round_2,
            can_resume=True
        )
        
    except Exception as e:
        logger.error(f"Error in get_active_bet: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/stats", response_model=PlayerStatsResponse)
async def get_player_stats(
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(...)
):
    """Get player statistics."""
    try:
        user_uuid = uuid.UUID(x_user_id)
        stats = await get_or_create_stats(db, user_uuid)
        
        return PlayerStatsResponse(
            user_id=stats.user_id,
            win_streak=stats.win_streak,
            max_streak=stats.max_streak,
            login_streak=stats.login_streak,
            total_bets=stats.total_bets,
            total_wins=stats.total_wins,
            total_losses=stats.total_losses,
            xp=stats.xp,
            level=stats.level,
            orbit_wins=stats.orbit_wins,
            orbit_losses=stats.orbit_losses,
            best_win_streak=stats.best_win_streak,
            total_payout=float(stats.total_payout),
            last_played=stats.last_played
        )
        
    except Exception as e:
        logger.error(f"Error in get_player_stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/history", response_model=List[BetHistoryResponse])
async def get_bet_history(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(...)
):
    """Get bet history."""
    try:
        user_uuid = uuid.UUID(x_user_id)
        
        query = await db.execute(
            select(Bet)
            .where(Bet.user_id == user_uuid)
            .order_by(desc(Bet.created_at))
            .limit(limit)
            .offset(offset)
        )
        bets = query.scalars().all()
        
        return [
            BetHistoryResponse(
                id=bet.id,
                symbol=bet.symbol,
                stake=float(bet.stake),
                payout=float(bet.payout) if bet.payout else None,
                status=bet.status,
                round_1=bet.round_1,
                round_2=bet.round_2,
                round_3=bet.round_3,
                created_at=bet.created_at,
                resolved_at=bet.resolved_at
            )
            for bet in bets
        ]
        
    except Exception as e:
        logger.error(f"Error in get_bet_history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")
