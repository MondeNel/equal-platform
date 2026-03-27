# services/trading-service/app/routers/trades.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
import uuid
import logging
from datetime import datetime

from app.database import get_db
from app.models import OpenTrade, TradeHistory
from app.schemas import CloseTradeRequest
from app.services.price_service import get_price
from app.services.wallet_mock import release_margin

router = APIRouter(prefix="/api/trades", tags=["trades"])
logger = logging.getLogger(__name__)

LOT_PIP_VALUES = {
    "Macro":    Decimal("0.10"),
    "Mini":     Decimal("1.00"),
    "Standard": Decimal("10.00"),
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


@router.get("/open")
async def get_open_trades(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OpenTrade)
        .where(OpenTrade.user_id == uuid.UUID(x_user_id))
        .order_by(OpenTrade.opened_at.desc())
    )
    trades = result.scalars().all()

    response = []
    for t in trades:
        current_price = get_price(t.symbol)
        pnl = calculate_pnl(t, current_price) if current_price else Decimal("0")
        response.append({
            "id":            str(t.id),
            "symbol":        t.symbol,
            "direction":     t.direction,
            "lot_size":      t.lot_size,
            "volume":        t.volume,
            "entry_price":   float(t.entry_price),
            "take_profit":   float(t.take_profit) if t.take_profit else None,
            "stop_loss":     float(t.stop_loss) if t.stop_loss else None,
            "current_price": current_price,
            "pnl":           float(pnl),
            "margin":        float(t.margin),
            "opened_at":     t.opened_at.isoformat(),
        })
    return response


@router.post("/{trade_id}/close")
async def close_trade(
    trade_id: str,
    data: CloseTradeRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OpenTrade)
        .where(OpenTrade.id == uuid.UUID(trade_id))
        .where(OpenTrade.user_id == uuid.UUID(x_user_id))
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    close_price = float(data.close_price) if data.close_price else get_price(trade.symbol)
    pnl = calculate_pnl(trade, close_price)

    # Save to history
    history = TradeHistory(
        user_id      = trade.user_id,
        symbol       = trade.symbol,
        direction    = trade.direction,
        lot_size     = trade.lot_size,
        volume       = trade.volume,
        entry_price  = trade.entry_price,
        close_price  = Decimal(str(close_price)),
        take_profit  = trade.take_profit,
        stop_loss    = trade.stop_loss,
        pnl          = pnl,
        close_reason = data.close_reason,
        opened_at    = trade.opened_at,
    )
    db.add(history)
    await db.delete(trade)

    # Release margin + apply PnL
    await release_margin(x_user_id, str(trade.id), float(pnl))

    await db.commit()

    return {
        "id":          str(history.id),
        "symbol":      history.symbol,
        "direction":   history.direction,
        "entry_price": float(history.entry_price),
        "close_price": float(history.close_price),
        "pnl":         float(history.pnl),
        "close_reason": history.close_reason,
        "closed_at":   history.closed_at.isoformat(),
    }


@router.post("/close-all")
async def close_all_trades(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OpenTrade).where(OpenTrade.user_id == uuid.UUID(x_user_id))
    )
    trades = result.scalars().all()

    closed = []
    for trade in trades:
        close_price = get_price(trade.symbol)
        pnl = calculate_pnl(trade, close_price)

        history = TradeHistory(
            user_id      = trade.user_id,
            symbol       = trade.symbol,
            direction    = trade.direction,
            lot_size     = trade.lot_size,
            volume       = trade.volume,
            entry_price  = trade.entry_price,
            close_price  = Decimal(str(close_price)),
            take_profit  = trade.take_profit,
            stop_loss    = trade.stop_loss,
            pnl          = pnl,
            close_reason = "MANUAL_CLOSE_ALL",
            opened_at    = trade.opened_at,
        )
        db.add(history)
        await db.delete(trade)

        await release_margin(x_user_id, str(trade.id), float(pnl))

        closed.append(str(trade.id))

    await db.commit()
    return {"closed": closed, "count": len(closed)}


@router.get("/history")
async def get_trade_history(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TradeHistory)
        .where(TradeHistory.user_id == uuid.UUID(x_user_id))
        .order_by(TradeHistory.closed_at.desc())
        .limit(50)
    )
    trades = result.scalars().all()
    return [
        {
            "id":          str(t.id),
            "symbol":      t.symbol,
            "direction":   t.direction,
            "lot_size":    t.lot_size,
            "volume":      t.volume,
            "entry_price": float(t.entry_price),
            "close_price": float(t.close_price),
            "pnl":         float(t.pnl),
            "close_reason": t.close_reason,
            "opened_at":   t.opened_at.isoformat(),
            "closed_at":   t.closed_at.isoformat(),
        }
        for t in trades
    ]