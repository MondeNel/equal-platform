from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
import uuid

from app.database import get_db
from app.models import Bet, PlayerStats
from app.schemas import PlaceBetRequest, ResolveBetRequest
from app.services.bet_engine import get_current_price, resolve_round

router = APIRouter(prefix="/api/bet", tags=["orbitbet"])

STREAK_BONUSES = {3: 3, 6: 6, 9: 9, 12: 12, 15: 15, 18: 18}

def calculate_multiplier(streak: int) -> Decimal:
    streak = streak or 0
    multi = Decimal("1.0")
    for milestone in sorted(STREAK_BONUSES.keys()):
        if streak >= milestone:
            multi = Decimal(str(STREAK_BONUSES[milestone]))
    return multi

@router.post("/place")
async def place_bet(data: PlaceBetRequest, x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    user_uuid = uuid.UUID(x_user_id)
    entry_price = await get_current_price(data.symbol)
    
    # Step 1 Result
    result = resolve_round(data.direction, entry_price, entry_price)

    stats_query = await db.execute(select(PlayerStats).where(PlayerStats.user_id == user_uuid))
    stats = stats_query.scalar_one_or_none()
    if not stats:
        stats = PlayerStats(user_id=user_uuid, win_streak=0, total_bets=0)
        db.add(stats)
    
    stats.total_bets += 1
    active_multi = calculate_multiplier(stats.win_streak)

    bet = Bet(
        user_id=user_uuid, symbol=data.symbol, direction=data.direction,
        stake=data.stake, multiplier=active_multi, entry_price=Decimal(str(entry_price)),
        round_1=result, current_step=1, status="ACTIVE"
    )

    db.add(bet)
    await db.commit()
    await db.refresh(bet)

    return {"bet_id": str(bet.id), "result": result, "step": 1, "status": bet.status}

@router.post("/continue")
async def continue_bet(data: ResolveBetRequest, x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    user_uuid = uuid.UUID(x_user_id)
    bet_query = await db.execute(select(Bet).where(Bet.id == uuid.UUID(data.bet_id)))
    bet = bet_query.scalar_one_or_none()

    if not bet or bet.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Orbit session closed or not found")

    bet.current_step += 1
    current_price = await get_current_price(bet.symbol)
    round_result = resolve_round(bet.direction, float(bet.entry_price), current_price)

    if bet.current_step == 2:
        bet.round_2 = round_result
    elif bet.current_step == 3:
        bet.round_3 = round_result

    if bet.current_step == 3:
        stats_query = await db.execute(select(PlayerStats).where(PlayerStats.user_id == user_uuid))
        stats = stats_query.scalar_one_or_none()

        # Best of 3 Tally
        outcomes = [bet.round_1, bet.round_2, bet.round_3]
        if outcomes.count("WIN") >= 2:
            bet.status = "WON"
            stats.win_streak += 1
            stats.total_wins += 1
            if stats.win_streak > stats.max_streak:
                stats.max_streak = stats.win_streak
            bet.payout = bet.stake * Decimal("1.85") * bet.multiplier
        else:
            bet.status = "LOST"
            stats.win_streak = 0
    
    await db.commit()
    return {"result": round_result, "step": bet.current_step, "status": bet.status}