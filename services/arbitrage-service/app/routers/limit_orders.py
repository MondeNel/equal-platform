from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from decimal import Decimal
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models import LimitOrder, LimitOrderHistory
from app.schemas import LimitOrderRequest, LimitOrderResponse

router = APIRouter(prefix="/api/arb/limit", tags=["arbitrage-limit"])


@router.post("/create", response_model=LimitOrderResponse)
async def create_limit_order(
    data: LimitOrderRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Create a limit order that executes when buy exchange price reaches target"""
    user_id = uuid.UUID(x_user_id)
    
    # Validate amount
    if data.amount < 10:
        raise HTTPException(status_code=400, detail="Minimum amount is ZAR 10")
    if data.amount > 100000:
        raise HTTPException(status_code=400, detail="Maximum amount is ZAR 100,000")
    
    # For limit orders, we store target_spread_pct as target_buy_price (simplified)
    # We'll rename in database later, but for now use the same field
    
    # Create limit order
    expires_at = datetime.utcnow() + timedelta(minutes=data.expires_in_minutes)
    limit_order = LimitOrder(
        user_id=user_id,
        symbol=data.symbol,
        buy_exchange=data.buy_exchange,
        sell_exchange=data.sell_exchange,
        amount=data.amount,
        target_spread_pct=Decimal(str(data.target_spread_pct)),  # This now stores target buy price
        expires_at=expires_at,
        status="PENDING"
    )
    db.add(limit_order)
    await db.commit()
    await db.refresh(limit_order)
    
    return LimitOrderResponse(
        id=str(limit_order.id),
        symbol=limit_order.symbol,
        buy_exchange=limit_order.buy_exchange,
        sell_exchange=limit_order.sell_exchange,
        amount=limit_order.amount,
        target_spread_pct=float(limit_order.target_spread_pct),
        status=limit_order.status,
        expires_at=limit_order.expires_at,
        created_at=limit_order.created_at,
        executed_at=limit_order.executed_at,
        executed_profit=float(limit_order.executed_profit) if limit_order.executed_profit else None
    )


@router.get("/pending")
async def get_pending_orders(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Get all pending limit orders for the user"""
    result = await db.execute(
        select(LimitOrder)
        .where(and_(LimitOrder.user_id == uuid.UUID(x_user_id), LimitOrder.status == "PENDING"))
        .order_by(LimitOrder.created_at.desc())
    )
    orders = result.scalars().all()
    return [
        {
            "id": str(o.id),
            "symbol": o.symbol,
            "buy_exchange": o.buy_exchange,
            "sell_exchange": o.sell_exchange,
            "amount": float(o.amount),
            "target_buy_price": float(o.target_spread_pct),  # Target price for buy exchange
            "expires_at": o.expires_at.isoformat(),
            "created_at": o.created_at.isoformat(),
        }
        for o in orders
    ]


@router.post("/cancel/{order_id}")
async def cancel_limit_order(
    order_id: str,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a pending limit order"""
    result = await db.execute(
        select(LimitOrder)
        .where(and_(LimitOrder.id == uuid.UUID(order_id), LimitOrder.user_id == uuid.UUID(x_user_id), LimitOrder.status == "PENDING"))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Limit order not found or already executed")
    
    order.status = "CANCELLED"
    order.cancelled_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Limit order cancelled", "order_id": order_id}


@router.get("/history")
async def get_limit_order_history(
    x_user_id: str = Header(...),
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Get limit order history (executed, expired, cancelled)"""
    result = await db.execute(
        select(LimitOrderHistory)
        .where(LimitOrderHistory.user_id == uuid.UUID(x_user_id))
        .order_by(LimitOrderHistory.changed_at.desc())
        .limit(limit)
    )
    history = result.scalars().all()
    return [
        {
            "id": str(h.id),
            "order_id": str(h.order_id),
            "symbol": h.symbol,
            "buy_exchange": h.buy_exchange,
            "sell_exchange": h.sell_exchange,
            "amount": float(h.amount),
            "target_buy_price": float(h.target_spread_pct),
            "executed_price": float(h.executed_price) if h.executed_price else None,
            "executed_profit": float(h.executed_profit) if h.executed_profit else None,
            "status": h.status,
            "created_at": h.created_at.isoformat(),
            "executed_at": h.executed_at.isoformat() if h.executed_at else None,
        }
        for h in history
    ]
