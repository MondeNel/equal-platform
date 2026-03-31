from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from decimal import Decimal
import uuid
import httpx
import os

from app.database import get_db
from app.models import OpenTrade, TradeHistory, PlayerStats
from app.schemas import CloseTradeRequest, TradeResponse, TradeHistoryResponse

router = APIRouter(prefix="/api/trades", tags=["trades"])

WALLET_SERVICE_URL = os.getenv("WALLET_SERVICE_URL", "http://wallet-service:8002")

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
async def get_open_trades(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(OpenTrade)
        .where(OpenTrade.user_id == uuid.UUID(x_user_id))
        .order_by(OpenTrade.opened_at.desc())
    )
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
        )
        for t in trades
    ]

@router.post("/{trade_id}/close")
async def close_trade(
    trade_id: str,
    data: CloseTradeRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    # Fetch the open trade
    result = await db.execute(
        select(OpenTrade)
        .where(and_(
            OpenTrade.id == uuid.UUID(trade_id),
            OpenTrade.user_id == uuid.UUID(x_user_id)
        ))
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    close_price = float(data.close_price) if data.close_price else float(trade.entry_price)
    base_pnl = calculate_pnl(trade, close_price)
    
    # Get player stats for streak
    stats_result = await db.execute(
        select(PlayerStats).where(PlayerStats.user_id == trade.user_id)
    )
    stats = stats_result.scalar_one_or_none()
    if not stats:
        stats = PlayerStats(user_id=trade.user_id)
        db.add(stats)
        await db.flush()
    
    is_win = base_pnl > 0
    bonus_applied = False
    final_pnl = base_pnl
    multiplier = Decimal('1.0')
    
    if is_win:
        stats.win_streak += 1
        if stats.win_streak > stats.max_streak:
            stats.max_streak = stats.win_streak
        stats.total_wins += 1
        
        # Apply streak bonus if milestone reached
        if stats.win_streak in STREAK_BONUSES:
            multiplier = STREAK_BONUSES[stats.win_streak]
            final_pnl = base_pnl * multiplier
            bonus_applied = True
    else:
        stats.win_streak = max(0, stats.win_streak - 1)
        stats.total_losses += 1
    
    stats.total_bets += 1
    await db.commit()
    
    # Record history with the final PnL (boosted if applicable)
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
        opened_at=trade.opened_at
    )
    db.add(history)
    await db.delete(trade)
    
    # Release margin with the final PnL
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{WALLET_SERVICE_URL}/api/wallet/release",
            json={
                "amount": float(trade.margin),
                "reference": str(trade.id),
                "pnl": float(final_pnl)
            },
            headers={"X-User-ID": x_user_id}
        )
    
    await db.commit()
    
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
        )
        for t in trades
    ]