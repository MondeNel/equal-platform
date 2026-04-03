from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
import uuid
import httpx

from app.database import get_db
from app.models import OpenTrade
from app.schemas import CopyTradeRequest, CopyTradeResponse
from app.services.follow_client import check_copy_limit, record_copy_trade
from app.routers.orders import LOT_PIP_VALUES

router = APIRouter(prefix="/api/copy", tags=["copy"])


@router.post("/execute", response_model=CopyTradeResponse)
async def execute_copy_trade(
    data: CopyTradeRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    follower_id = uuid.UUID(x_user_id)

    # 1. Fetch original trade (must be open)
    result = await db.execute(
        select(OpenTrade).where(OpenTrade.id == uuid.UUID(data.original_trade_id))
    )
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Original trade not found")

    # 2. Check copy limit
    limit_info = await check_copy_limit(x_user_id)
    if not limit_info["can_copy"]:
        raise HTTPException(status_code=403, detail=limit_info["message"])

    # 3. Record copy in follow service
    copy_record = await record_copy_trade(
        follower_id=x_user_id,
        trader_id=str(original.user_id),
        original_trade_id=str(original.id),
        symbol=original.symbol,
        lot_size=data.lot_size,
        volume=data.volume
    )

    # 4. Calculate margin
    pip_value = LOT_PIP_VALUES.get(data.lot_size, Decimal("1.00"))
    margin = pip_value * Decimal("100") * Decimal(str(data.volume))

    # 5. Reserve margin from wallet
    async with httpx.AsyncClient(timeout=10.0) as client:
        reserve_resp = await client.post(
            "http://wallet-service:8000/api/wallet/reserve",
            json={"amount": float(margin), "reference": str(uuid.uuid4())},
            headers={"X-User-ID": x_user_id}
        )
        if reserve_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Insufficient balance")

    # 6. Create open trade for follower
    new_trade = OpenTrade(
        user_id=follower_id,
        symbol=original.symbol,
        direction=original.direction,
        lot_size=data.lot_size,
        volume=data.volume,
        entry_price=original.entry_price,
        take_profit=original.take_profit,
        stop_loss=original.stop_loss,
        margin=margin,
        copy_trade_id=uuid.UUID(copy_record["id"])
    )
    db.add(new_trade)
    await db.commit()
    await db.refresh(new_trade)

    return CopyTradeResponse(
        id=str(new_trade.id),
        copy_trade_id=copy_record["id"],
        symbol=new_trade.symbol,
        direction=new_trade.direction,
        lot_size=new_trade.lot_size,
        volume=new_trade.volume,
        entry_price=float(new_trade.entry_price),
        margin=float(new_trade.margin),
        created_at=new_trade.opened_at.isoformat()
    )
