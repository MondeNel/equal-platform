from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
import uuid

from app.database import get_db
from app.models import Bet, PlayerStats
from app.schemas import PlaceBetRequest, ResolveBetRequest
from app.services.bet_engine import (
    get_current_price,
    resolve_round,
    is_near_miss_price,
)

router = APIRouter(prefix="/api/bet", tags=["orbitbet"])

# --- B2B Multiplier Table ---
STREAK_BONUSES = {3: 3, 6: 6, 9: 9, 12: 12, 15: 15, 18: 18}

def calculate_multiplier(streak: int) -> Decimal:
    """Calculates the active multiplier based on current win streak."""
    multi = Decimal("1.0")
    for milestone in sorted(STREAK_BONUSES.keys()):
        if streak >= milestone:
            multi = Decimal(str(STREAK_BONUSES[milestone]))
    return multi

@router.post("/place")
async def place_bet(
    data: PlaceBetRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    user_uuid = uuid.UUID(x_user_id)
    
    # 1. Fetch Entry Price
    entry_price = await get_current_price(data.symbol)
    
    # 2. Resolve Round 1 (Outer Ring)
    current_price = await get_current_price(data.symbol) 
    result = resolve_round(data.direction, entry_price, current_price)

    # 3. Fetch Player Stats for Streak Multiplier
    stats_query = await db.execute(select(PlayerStats).where(PlayerStats.user_id == user_uuid))
    stats = stats_query.scalar_one_or_none()
    
    if not stats:
        stats = PlayerStats(user_id=user_uuid)
        db.add(stats)
    
    active_multi = calculate_multiplier(stats.win_streak)

    bet = Bet(
        user_id=user_uuid,
        symbol=data.symbol,
        direction=data.direction,
        stake=data.stake,
        multiplier=active_multi,
        entry_price=Decimal(str(entry_price)),
        round_1=result,
        current_step=1,
        status="ACTIVE" if result == "WIN" else "LOST"
    )

    if result == "LOSS":
        stats.win_streak = 0  # Reset streak immediately on first-ring loss

    db.add(bet)
    await db.commit()
    await db.refresh(bet)

    return {
        "bet_id": str(bet.id),
        "result": result,
        "step": 1,
        "streak": stats.win_streak,
        "multiplier": float(active_multi),
        "status": bet.status
    }

@router.post("/continue")
async def continue_bet(
    data: ResolveBetRequest, 
    x_user_id: str = Header(...), 
    db: AsyncSession = Depends(get_db)
):
    user_uuid = uuid.UUID(x_user_id)
    result = await db.execute(select(Bet).where(Bet.id == uuid.UUID(data.bet_id)))
    bet = result.scalar_one_or_none()

    if not bet or bet.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="No active bet found")

    # Resolve Round 2 (Inner Ring)
    next_step = 2 
    current_price = await get_current_price(bet.symbol)
    round_result = resolve_round(bet.direction, float(bet.entry_price), current_price)

    # Fetch Stats to update streak
    stats_query = await db.execute(select(PlayerStats).where(PlayerStats.user_id == user_uuid))
    stats = stats_query.scalar_one_or_none()

    final_visual_result = round_result
    if round_result == "LOSS":
        if is_near_miss_price(bet.direction, float(bet.entry_price), current_price):
            final_visual_result = "NEAR_MISS"
        
        bet.status = "LOST"
        bet.round_2 = "LOSS"
        stats.win_streak = 0 # Reset streak
    else:
        # WIN - Complete the Orbit
        bet.round_2 = "WIN"
        bet.status = "WON"
        stats.win_streak += 1
        if stats.win_streak > stats.max_streak:
            stats.max_streak = stats.win_streak
        
        # Calculate Payout (Stake * Base Orbit Multiplier * Streak Bonus)
        base_orbit_multi = Decimal("1.85")
        bet.payout = bet.stake * base_orbit_multi * bet.multiplier
        # TODO: Trigger wallet-service.credit_balance(user_id, bet.payout)

    bet.current_step = next_step
    await db.commit()

    return {
        "result": final_visual_result, 
        "step": next_step, 
        "status": bet.status,
        "streak": stats.win_streak,
        "multiplier": float(calculate_multiplier(stats.win_streak)),
        "bet_id": str(bet.id)
    }