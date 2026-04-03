from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from decimal import Decimal
import uuid
import httpx
import os
import logging

from app.database import get_db
from app.models import OpenTrade, TradeHistory, PlayerStats, PendingBonus
from app.schemas import CloseTradeRequest, TradeResponse, TradeHistoryResponse
from app.services.follow_client import notify_trade, close_copy_trade

router = APIRouter(prefix="/api/trades", tags=["trades"])
logger = logging.getLogger(__name__)

WALLET_SERVICE_URL = os.getenv("WALLET_SERVICE_URL", "http://wallet-service:8000")
LOT_PIP_VALUES = {
    "Macro": Decimal("0.10"),
    "Mini": Decimal("1.00"),
    "Standard": Decimal("10.00"),
}
STREAK_BONUSES = {
    3: Decimal('1.85'),
    6: Decimal('2.0'),
    9: Decimal('2.5'),
}

def calculate_pnl(trade: OpenTrade, close_price: float) -> Decimal:
    pip_value = LOT_PIP_VALUES.get(trade.lot_size, Decimal("1.00"))
    entry = Decimal(str(trade.entry_price))
    close = Decimal(str(close_price))
    volume = Decimal(str(trade.volume))
    if trade.direction == "BUY":
        pips = (close - entry) * Decimal("100")
    else:
        pips = (entry - close) * Decimal("100")
    return round(pips * pip_value * volume, 2)


@router.get("/open", response_model=list[TradeResponse])
async def get_open_trades(x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OpenTrade).where(OpenTrade.user_id == uuid.UUID(x_user_id)).order_by(OpenTrade.opened_at.desc()))
    trades = result.scalars().all()
    return [
        TradeResponse(
            id=t.id,
            symbol=t.symbol,
            direction=t.direction,
            lot_size=t.lot_size,
            volume=t.volume,
            entry_price=float(t.entry_price),
            take_profit=float(t.take_profit) if t.take_profit else None,
            stop_loss=float(t.stop_loss) if t.stop_loss else None,
            current_price=None,
            pnl=0,
            margin=float(t.margin),
            opened_at=t.opened_at
        ) for t in trades
    ]


@router.post("/{trade_id}/close")
async def close_trade(
    trade_id: str,
    data: CloseTradeRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(OpenTrade).where(OpenTrade.id == uuid.UUID(trade_id), OpenTrade.user_id == uuid.UUID(x_user_id)))
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    close_price = float(data.close_price) if data.close_price else float(trade.entry_price)
    base_pnl = calculate_pnl(trade, close_price)

    stats_result = await db.execute(select(PlayerStats).where(PlayerStats.user_id == trade.user_id))
    stats = stats_result.scalar_one_or_none()
    if not stats:
        stats = PlayerStats(user_id=trade.user_id)
        db.add(stats)
        await db.flush()

    is_win = base_pnl > 0
    if not is_win:
        stats.win_streak = max(0, stats.win_streak - 1)
        stats.total_losses += 1
        stats.total_bets += 1
        final_pnl = base_pnl
        bonus_applied = False
        history = TradeHistory(
            user_id=trade.user_id,
            symbol=trade.symbol,
            direction=trade.direction,
            lot_size=trade.lot_size,
            volume=trade.volume,
            entry_price=trade.entry_price,
            close_price=Decimal(str(close_price)),
            take_profit=trade.take_profit,
            stop_loss=trade.stop_loss,
            pnl=final_pnl,
            close_reason=data.close_reason,
            opened_at=trade.opened_at,
            copy_trade_id=trade.copy_trade_id,
        )
        db.add(history)
        await db.delete(trade)
        await db.commit()
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{WALLET_SERVICE_URL}/api/wallet/release",
                json={"amount": float(trade.margin), "reference": str(trade.id), "pnl": float(final_pnl)},
                headers={"X-User-ID": x_user_id}
            )
        # If this was a copy trade, close it in follow service
        if trade.copy_trade_id:
            try:
                await close_copy_trade(x_user_id, str(trade.copy_trade_id), final_pnl)
            except Exception as e:
                logger.error(f"Failed to close copy trade {trade.copy_trade_id}: {e}")
        return {
            "id": str(history.id),
            "symbol": history.symbol,
            "direction": history.direction,
            "entry_price": float(history.entry_price),
            "close_price": float(history.close_price),
            "pnl": float(history.pnl),
            "close_reason": history.close_reason,
            "closed_at": history.closed_at.isoformat(),
            "bonus_applied": bonus_applied,
            "win_streak": stats.win_streak
        }

    # Win case
    new_streak = stats.win_streak + 1
    milestone = None
    multiplier = Decimal('1.0')
    for m in sorted(STREAK_BONUSES.keys()):
        if new_streak == m:
            milestone = m
            multiplier = STREAK_BONUSES[m]
            break
    offered = set(stats.milestones_offered.split(",")) if stats.milestones_offered else set()
    if milestone is not None and str(milestone) not in offered:
        pending = PendingBonus(
            trade_id=trade.id,
            user_id=trade.user_id,
            base_pnl=base_pnl,
            multiplier=multiplier,
            milestone=milestone,
            close_price=Decimal(str(close_price)),
            status="PENDING"
        )
        db.add(pending)
        await db.commit()
        return {
            "bonus_available": True,
            "milestone": milestone,
            "multiplier": float(multiplier),
            "trade_id": str(trade.id),
            "message": f"You've reached a {milestone}-win streak! Would you like to cash out with a {multiplier}x bonus or continue?"
        }
    else:
        final_pnl = base_pnl
        bonus_applied = False
        stats.win_streak += 1
        if stats.win_streak > stats.max_streak:
            stats.max_streak = stats.win_streak
        stats.total_wins += 1
        stats.total_bets += 1
        history = TradeHistory(
            user_id=trade.user_id,
            symbol=trade.symbol,
            direction=trade.direction,
            lot_size=trade.lot_size,
            volume=trade.volume,
            entry_price=trade.entry_price,
            close_price=Decimal(str(close_price)),
            take_profit=trade.take_profit,
            stop_loss=trade.stop_loss,
            pnl=final_pnl,
            close_reason=data.close_reason,
            opened_at=trade.opened_at,
            copy_trade_id=trade.copy_trade_id,
        )
        db.add(history)
        await db.delete(trade)
        await db.commit()
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{WALLET_SERVICE_URL}/api/wallet/release",
                json={"amount": float(trade.margin), "reference": str(trade.id), "pnl": float(final_pnl)},
                headers={"X-User-ID": x_user_id}
            )
        if trade.copy_trade_id:
            try:
                await close_copy_trade(x_user_id, str(trade.copy_trade_id), final_pnl)
            except Exception as e:
                logger.error(f"Failed to close copy trade {trade.copy_trade_id}: {e}")
        return {
            "id": str(history.id),
            "symbol": history.symbol,
            "direction": history.direction,
            "entry_price": float(history.entry_price),
            "close_price": float(history.close_price),
            "pnl": float(history.pnl),
            "close_reason": history.close_reason,
            "closed_at": history.closed_at.isoformat(),
            "bonus_applied": bonus_applied,
            "win_streak": stats.win_streak
        }


# ── Bonus decision endpoint (unchanged) ──────────────────────────────────────
@router.post("/{trade_id}/bonus_decision")
async def bonus_decision(
    trade_id: str,
    data: dict,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    action = data.get("action")
    result = await db.execute(select(PendingBonus).where(and_(PendingBonus.trade_id == uuid.UUID(trade_id), PendingBonus.user_id == uuid.UUID(x_user_id), PendingBonus.status == "PENDING")))
    pending = result.scalar_one_or_none()
    if not pending:
        raise HTTPException(status_code=404, detail="No pending bonus found")
    trade_result = await db.execute(select(OpenTrade).where(OpenTrade.id == pending.trade_id))
    trade = trade_result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    if action == "cashout":
        final_pnl = pending.base_pnl * pending.multiplier
        bonus_applied = True
    else:
        final_pnl = pending.base_pnl
        bonus_applied = False
    history = TradeHistory(
        user_id=trade.user_id,
        symbol=trade.symbol,
        direction=trade.direction,
        lot_size=trade.lot_size,
        volume=trade.volume,
        entry_price=trade.entry_price,
        close_price=pending.close_price,
        take_profit=trade.take_profit,
        stop_loss=trade.stop_loss,
        pnl=final_pnl,
        close_reason="BONUS_DECISION",
        opened_at=trade.opened_at,
        copy_trade_id=trade.copy_trade_id,
    )
    db.add(history)
    await db.delete(trade)
    stats_result = await db.execute(select(PlayerStats).where(PlayerStats.user_id == trade.user_id))
    stats = stats_result.scalar_one_or_none()
    if not stats:
        stats = PlayerStats(user_id=trade.user_id)
        db.add(stats)
    stats.win_streak += 1
    if stats.win_streak > stats.max_streak:
        stats.max_streak = stats.win_streak
    stats.total_wins += 1
    stats.total_bets += 1
    offered = set(stats.milestones_offered.split(",")) if stats.milestones_offered else set()
    offered.add(str(pending.milestone))
    stats.milestones_offered = ",".join(sorted(offered, key=int))
    pending.status = "PROCESSED"
    await db.commit()
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{WALLET_SERVICE_URL}/api/wallet/release",
            json={"amount": float(trade.margin), "reference": str(trade.id), "pnl": float(final_pnl)},
            headers={"X-User-ID": x_user_id}
        )
    if trade.copy_trade_id:
        try:
            await close_copy_trade(x_user_id, str(trade.copy_trade_id), final_pnl)
        except Exception as e:
            logger.error(f"Failed to close copy trade {trade.copy_trade_id}: {e}")
    return {
        "success": True,
        "pnl": float(final_pnl),
        "bonus_applied": bonus_applied,
        "win_streak": stats.win_streak
    }


@router.get("/history", response_model=list[TradeHistoryResponse])
async def get_trade_history(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
    limit: int = 50
):
    result = await db.execute(
        select(TradeHistory)
        .where(TradeHistory.user_id == uuid.UUID(x_user_id))
        .order_by(TradeHistory.closed_at.desc())
        .limit(limit)
    )
    trades = result.scalars().all()
    return [
        TradeHistoryResponse(
            id=t.id,
            symbol=t.symbol,
            direction=t.direction,
            lot_size=t.lot_size,
            volume=t.volume,
            entry_price=float(t.entry_price),
            close_price=float(t.close_price),
            pnl=float(t.pnl),
            close_reason=t.close_reason,
            opened_at=t.opened_at,
            closed_at=t.closed_at
        ) for t in trades
    ]
