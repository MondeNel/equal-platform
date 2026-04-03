from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
import uuid

from app.database import get_db
from app.models import Wallet, Transaction
from app.schemas import DebitRequest, CreditRequest

router = APIRouter(prefix="/api/wallet", tags=["wallet"])

async def get_wallet(user_id: str, db: AsyncSession):
    result = await db.execute(select(Wallet).where(Wallet.user_id == uuid.UUID(user_id)))
    wallet = result.scalar_one_or_none()
    if not wallet:
        wallet = Wallet(user_id=uuid.UUID(user_id))
        db.add(wallet)
        await db.flush()
    return wallet

@router.post("/debit")
async def debit(
    data: DebitRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    wallet = await get_wallet(x_user_id, db)
    if wallet.available < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    wallet.available -= data.amount
    wallet.balance -= data.amount
    tx = Transaction(
        user_id=uuid.UUID(x_user_id),
        type="DEBIT",
        amount=data.amount,
        description="Platform debit",
        reference=data.reference
    )
    db.add(tx)
    await db.commit()
    return {"message": "Debited", "reference": data.reference}

@router.post("/credit")
async def credit(
    data: CreditRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    wallet = await get_wallet(x_user_id, db)
    wallet.available += data.amount
    wallet.balance += data.amount
    tx = Transaction(
        user_id=uuid.UUID(x_user_id),
        type="CREDIT",
        amount=data.amount,
        description="Platform credit",
        reference=data.reference
    )
    db.add(tx)
    await db.commit()
    return {"message": "Credited", "reference": data.reference}
