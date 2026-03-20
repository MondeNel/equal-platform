from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date
import uuid

from app.database import get_db
from app.models import PeterUsage
from app.schemas import PeterAnalyseRequest
from app.services.peter_service import analyse
from app.services.price_service import get_price

router = APIRouter(prefix="/api/peter", tags=["peter"])

DAILY_LIMIT_FREE = 3


async def check_and_increment_usage(user_id: str, db: AsyncSession):
    today = date.today()
    result = await db.execute(
        select(PeterUsage)
        .where(PeterUsage.user_id == uuid.UUID(user_id))
        .where(PeterUsage.date == today)
    )
    usage = result.scalar_one_or_none()

    if not usage:
        usage = PeterUsage(
            user_id = uuid.UUID(user_id),
            date    = today,
            uses    = 0,
        )
        db.add(usage)

    if usage.uses >= DAILY_LIMIT_FREE:
        raise HTTPException(
            status_code=429,
            detail=f"Daily Peter AI limit reached ({DAILY_LIMIT_FREE}/day on FREE plan). Upgrade for unlimited access."
        )

    usage.uses += 1
    await db.commit()
    return usage.uses


@router.post("/analyse")
async def peter_analyse(
    data: PeterAnalyseRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    uses_today = await check_and_increment_usage(x_user_id, db)

    price = float(data.price) if data.price else get_price(data.symbol)

    result = await analyse(
        symbol        = data.symbol,
        price         = price,
        direction     = data.direction,
        entry         = float(data.entry) if data.entry else None,
        tp            = float(data.tp) if data.tp else None,
        sl            = float(data.sl) if data.sl else None,
        analysis_type = data.analysis_type,
    )

    return {
        **result,
        "uses_today":  uses_today,
        "daily_limit": DAILY_LIMIT_FREE,
        "remaining":   max(0, DAILY_LIMIT_FREE - uses_today),
    }


@router.get("/usage")
async def get_usage(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    result = await db.execute(
        select(PeterUsage)
        .where(PeterUsage.user_id == uuid.UUID(x_user_id))
        .where(PeterUsage.date == today)
    )
    usage = result.scalar_one_or_none()
    uses = usage.uses if usage else 0

    return {
        "uses_today":  uses,
        "daily_limit": DAILY_LIMIT_FREE,
        "remaining":   max(0, DAILY_LIMIT_FREE - uses),
    }