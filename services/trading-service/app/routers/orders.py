# services/trading-service/app/routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
import uuid
import logging

from app.database import get_db
from app.models import PendingOrder, OpenTrade
from app.schemas import PlaceOrderRequest, ActivateOrderRequest
from app.services.wallet_mock import reserve_margin, release_margin

router = APIRouter(prefix="/api/orders", tags=["orders"])
logger = logging.getLogger(__name__)

LOT_PIP_VALUES = {
    "Macro":    Decimal("0.10"),
    "Mini":     Decimal("1.00"),
    "Standard": Decimal("10.00"),
}


@router.post("/place")
async def place_order(
    data: PlaceOrderRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    pip_value = LOT_PIP_VALUES.get(data.lot_size, Decimal("1.00"))
    margin = pip_value * Decimal("100") * Decimal(str(data.volume))

    order_ref = str(uuid.uuid4())
    await reserve_margin(x_user_id, float(margin), order_ref)

    order = PendingOrder(
        user_id     = uuid.UUID(x_user_id),
        symbol      = data.symbol,
        direction   = data.direction,
        lot_size    = data.lot_size,
        volume      = data.volume,
        entry_price = data.entry_price,
        take_profit = data.take_profit,
        stop_loss   = data.stop_loss,
        margin      = margin,
        status      = "PENDING",
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    return {
        "id":          str(order.id),
        "symbol":      order.symbol,
        "direction":   order.direction,
        "lot_size":    order.lot_size,
        "volume":      order.volume,
        "entry_price": float(order.entry_price),
        "take_profit": float(order.take_profit) if order.take_profit else None,
        "stop_loss":   float(order.stop_loss) if order.stop_loss else None,
        "margin":      float(order.margin),
        "status":      order.status,
        "created_at":  order.created_at.isoformat(),
    }


@router.get("/pending")
async def get_pending_orders(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PendingOrder)
        .where(PendingOrder.user_id == uuid.UUID(x_user_id))
        .where(PendingOrder.status == "PENDING")
        .order_by(PendingOrder.created_at.desc())
    )
    orders = result.scalars().all()
    return [
        {
            "id":          str(o.id),
            "symbol":      o.symbol,
            "direction":   o.direction,
            "lot_size":    o.lot_size,
            "volume":      o.volume,
            "entry_price": float(o.entry_price),
            "take_profit": float(o.take_profit) if o.take_profit else None,
            "stop_loss":   float(o.stop_loss) if o.stop_loss else None,
            "margin":      float(o.margin),
            "status":      o.status,
            "created_at":  o.created_at.isoformat(),
        }
        for o in orders
    ]


@router.delete("/{order_id}")
async def cancel_order(
    order_id: str,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PendingOrder)
        .where(PendingOrder.id == uuid.UUID(order_id))
        .where(PendingOrder.user_id == uuid.UUID(x_user_id))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await release_margin(x_user_id, str(order.id), 0)

    order.status = "CANCELLED"
    await db.commit()
    return {"message": "Order cancelled"}


@router.post("/{order_id}/activate")
async def activate_order(
    order_id: str,
    data: ActivateOrderRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PendingOrder)
        .where(PendingOrder.id == uuid.UUID(order_id))
        .where(PendingOrder.user_id == uuid.UUID(x_user_id))
        .where(PendingOrder.status == "PENDING")
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    trade = OpenTrade(
        user_id     = order.user_id,
        symbol      = order.symbol,
        direction   = order.direction,
        lot_size    = order.lot_size,
        volume      = order.volume,
        entry_price = data.activation_price,
        take_profit = order.take_profit,
        stop_loss   = order.stop_loss,
        margin      = order.margin,
    )
    db.add(trade)
    order.status = "ACTIVATED"
    await db.commit()
    await db.refresh(trade)

    return {
        "id":          str(trade.id),
        "symbol":      trade.symbol,
        "direction":   trade.direction,
        "entry_price": float(trade.entry_price),
        "take_profit": float(trade.take_profit) if trade.take_profit else None,
        "stop_loss":   float(trade.stop_loss) if trade.stop_loss else None,
        "margin":      float(trade.margin),
        "opened_at":   trade.opened_at.isoformat(),
    }