from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from decimal import Decimal
from datetime import datetime, date
import uuid
import httpx
import os

from app.database import get_db
from app.models import Bet, PlayerStats
from app.schemas import PlaceBetRequest
from app.services.bet_engine import (
    get_current_price,
    resolve_round,
    calculate_payout,
    calculate_xp,
    get_level,
    is_near_miss,
    get_streak_milestone,
    MIN_STAKE,
    MAX_STAKE,
    MULTIPLIER,
)

router = APIRouter(prefix="/api/bet", tags=["orbitbet"])

WALLET_SERVICE = os.getenv("WALLET_SERVICE_URL", "http://wallet-service:8000")


async def get_or_create_stats(user_id: str, db: AsyncSession) -> PlayerStats:
    result = await db.execute(
        select(PlayerStats).where(PlayerStats.user_id == uuid.UUID(user_id))
    )
    stats = result.scalar_one_or_none()

    if not stats:
        stats = PlayerStats(
            user_id      = uuid.UUID(user_id),
            xp           = 0,
            level        = 1,
            win_streak   = 0,
            best_streak  = 0,
            login_streak = 1,
            total_bets   = 0,
            total_wins   = 0,
            last_login   = date.today(),
        )
        db.add(stats)
        await db.commit()
        await db.refresh(stats)

    return stats


@router.get("/markets")
async def get_markets():
    return {
        "markets": [
            {
                "id":      "Crypto",
                "label":   "Crypto",
                "symbols": ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"],
            },
            {
                "id":      "Forex",
                "label":   "Forex",
                "symbols": ["USD/ZAR", "EUR/USD", "GBP/USD", "USD/JPY"],
            },
        ],
        "multiplier":  float(MULTIPLIER),
        "min_stake":   float(MIN_STAKE),
        "max_stake":   float(MAX_STAKE),
    }


@router.post("/place")
async def place_bet(
    data: PlaceBetRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    if data.direction not in ("UP", "DOWN"):
        raise HTTPException(status_code=400, detail="Direction must be UP or DOWN")

    if data.stake < MIN_STAKE:
        raise HTTPException(status_code=400, detail=f"Minimum stake is R{MIN_STAKE}")

    if data.stake > MAX_STAKE:
        raise HTTPException(status_code=400, detail=f"Maximum stake is R{MAX_STAKE}")

    # Debit wallet
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            f"{WALLET_SERVICE}/api/wallet/debit",
            json={
                "amount":    float(data.stake),
                "reference": f"BET-{data.symbol}-{data.direction}",
            },
            headers={"x-user-id": x_user_id},
        )
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="Insufficient balance")

    # Get entry price
    entry_price = await get_current_price(data.symbol)

    # Create bet
    bet = Bet(
        user_id     = uuid.UUID(x_user_id),
        symbol      = data.symbol,
        direction   = data.direction,
        stake       = data.stake,
        multiplier  = MULTIPLIER,
        entry_price = Decimal(str(entry_price)),
        status      = "ACTIVE",
    )
    db.add(bet)
    await db.commit()
    await db.refresh(bet)

    # Resolve all 3 rounds with small delay simulation
    rounds = []
    wins   = 0
    losses = 0
    prices = [entry_price]

    for i in range(3):
        current_price = await get_current_price(data.symbol)
        prices.append(current_price)
        result = resolve_round(data.direction, entry_price, current_price)
        rounds.append(result)
        if result == "WIN":
            wins += 1
        else:
            losses += 1

    # Determine outcome
    won    = wins >= 2
    payout = calculate_payout(data.stake, wins)

    # Update bet
    bet.round_1     = rounds[0]
    bet.round_2     = rounds[1]
    bet.round_3     = rounds[2]
    bet.wins        = wins
    bet.losses      = losses
    bet.status      = "WON" if won else "LOST"
    bet.payout      = payout
    bet.resolved_at = datetime.utcnow()

    # Update player stats
    stats = await get_or_create_stats(x_user_id, db)
    stats.total_bets += 1

    if won:
        stats.total_wins += 1
        stats.win_streak += 1
        if stats.win_streak > stats.best_streak:
            stats.best_streak = stats.win_streak
    else:
        stats.win_streak = 0

    xp_earned    = calculate_xp(won, stats.win_streak)
    stats.xp    += xp_earned
    stats.level  = get_level(stats.xp)

    await db.commit()
    await db.refresh(bet)
    await db.refresh(stats)

    # Credit payout if won
    if won and payout > 0:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                f"{WALLET_SERVICE}/api/wallet/credit",
                json={
                    "amount":    float(payout),
                    "reference": f"BET-WIN-{bet.id}",
                },
                headers={"x-user-id": x_user_id},
            )

    # Check streak milestone
    milestone = get_streak_milestone(stats.win_streak) if won else None

    # Near miss detection
    near_miss = is_near_miss(rounds[0], rounds[1]) if len(rounds) >= 2 else False

    return {
        "id":          str(bet.id),
        "symbol":      bet.symbol,
        "direction":   bet.direction,
        "stake":       float(bet.stake),
        "entry_price": float(bet.entry_price),
        "rounds": [
            {"round": i + 1, "result": r, "price": prices[i + 1]}
            for i, r in enumerate(rounds)
        ],
        "wins":        wins,
        "losses":      losses,
        "status":      bet.status,
        "payout":      float(payout),
        "multiplier":  float(MULTIPLIER),
        "near_miss":   near_miss,
        "xp_earned":   xp_earned,
        "stats": {
            "xp":          stats.xp,
            "level":       stats.level,
            "win_streak":  stats.win_streak,
            "best_streak": stats.best_streak,
            "total_bets":  stats.total_bets,
            "total_wins":  stats.total_wins,
        },
        "milestone":   milestone,
        "resolved_at": bet.resolved_at.isoformat(),
    }


@router.get("/history")
async def get_bet_history(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Bet)
        .where(Bet.user_id == uuid.UUID(x_user_id))
        .order_by(Bet.created_at.desc())
        .limit(50)
    )
    bets = result.scalars().all()
    return [
        {
            "id":          str(b.id),
            "symbol":      b.symbol,
            "direction":   b.direction,
            "stake":       float(b.stake),
            "round_1":     b.round_1,
            "round_2":     b.round_2,
            "round_3":     b.round_3,
            "wins":        b.wins,
            "losses":      b.losses,
            "status":      b.status,
            "payout":      float(b.payout) if b.payout else 0,
            "created_at":  b.created_at.isoformat(),
            "resolved_at": b.resolved_at.isoformat() if b.resolved_at else None,
        }
        for b in bets
    ]


@router.get("/stats")
async def get_stats(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    stats = await get_or_create_stats(x_user_id, db)
    win_rate = round((stats.total_wins / stats.total_bets * 100), 1) if stats.total_bets > 0 else 0

    return {
        "xp":          stats.xp,
        "level":       stats.level,
        "xp_to_next":  500 - (stats.xp % 500),
        "win_streak":  stats.win_streak,
        "best_streak": stats.best_streak,
        "login_streak": stats.login_streak,
        "total_bets":  stats.total_bets,
        "total_wins":  stats.total_wins,
        "win_rate":    win_rate,
    }