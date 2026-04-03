from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
import uuid
from app.database import get_db
from app.models import Wallet, Transaction
from app.schemas import DepositRequest, WithdrawRequest, ReserveRequest, ReleaseRequest, DebitRequest, CreditRequest, WalletOut, TransactionOut

router = APIRouter(prefix="/api/wallet", tags=["wallet"])

async def get_wallet(user_id: str, db: AsyncSession):
    result = await db.execute(select(Wallet).where(Wallet.user_id == uuid.UUID(user_id)))
    wallet = result.scalar_one_or_none()
    if not wallet:
        wallet = Wallet(user_id=uuid.UUID(user_id), balance=0, margin=0)
        db.add(wallet)
        await db.flush()
    return wallet

@router.get("/", response_model=WalletOut)
async def get_wallet_info(x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    wallet = await get_wallet(x_user_id, db)
    return WalletOut(
        id=wallet.id,
        user_id=wallet.user_id,
        balance=wallet.balance,
        margin=wallet.margin,
        available=wallet.balance - wallet.margin
    )

@router.post("/deposit")
async def deposit(data: DepositRequest, x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    wallet = await get_wallet(x_user_id, db)
    wallet.balance += data.amount
    tx = Transaction(
        user_id=wallet.user_id,
        type="DEPOSIT",
        amount=data.amount,
        description="Deposit"
    )
    db.add(tx)
    await db.commit()
    return {"message": "Deposit successful", "balance": float(wallet.balance)}

@router.post("/withdraw")
async def withdraw(data: WithdrawRequest, x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    wallet = await get_wallet(x_user_id, db)
    if wallet.balance - wallet.margin < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient available balance")
    wallet.balance -= data.amount
    tx = Transaction(
        user_id=wallet.user_id,
        type="WITHDRAWAL",
        amount=data.amount,
        description="Withdrawal"
    )
    db.add(tx)
    await db.commit()
    return {"message": "Withdrawal successful", "balance": float(wallet.balance)}

@router.post("/reserve")
async def reserve(data: ReserveRequest, x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    wallet = await get_wallet(x_user_id, db)
    if wallet.balance - wallet.margin < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient available balance")
    wallet.margin += data.amount
    tx = Transaction(
        user_id=wallet.user_id,
        type="RESERVE",
        amount=data.amount,
        description=f"Reservation for {data.reference}"
    )
    db.add(tx)
    await db.commit()
    return {"message": "Reserved", "margin": float(wallet.margin)}

@router.post("/release")
async def release(data: ReleaseRequest, x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    wallet = await get_wallet(x_user_id, db)
    if wallet.margin < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient margin")
    wallet.margin -= data.amount
    wallet.balance += data.pnl
    tx = Transaction(
        user_id=wallet.user_id,
        type="RELEASE",
        amount=data.amount,
        description=f"Release for {data.reference}, PnL: {data.pnl}"
    )
    db.add(tx)
    await db.commit()
    return {"message": "Released", "balance": float(wallet.balance), "margin": float(wallet.margin)}

@router.post("/debit")
async def debit(data: DebitRequest, x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    wallet = await get_wallet(x_user_id, db)
    if wallet.balance - wallet.margin < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient available balance")
    wallet.balance -= data.amount
    tx = Transaction(
        user_id=wallet.user_id,
        type="DEBIT",
        amount=data.amount,
        description=f"Debit for {data.reference}"
    )
    db.add(tx)
    await db.commit()
    return {"message": "Debited", "balance": float(wallet.balance)}

@router.post("/credit")
async def credit(data: CreditRequest, x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    wallet = await get_wallet(x_user_id, db)
    wallet.balance += data.amount
    tx = Transaction(
        user_id=wallet.user_id,
        type="CREDIT",
        amount=data.amount,
        description=f"Credit for {data.reference}"
    )
    db.add(tx)
    await db.commit()
    return {"message": "Credited", "balance": float(wallet.balance)}

@router.get("/transactions", response_model=list[TransactionOut])
async def get_transactions(x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.user_id == uuid.UUID(x_user_id)).order_by(Transaction.created_at.desc()).limit(50))
    txs = result.scalars().all()
    return [
        TransactionOut(
            id=tx.id,
            type=tx.type,
            amount=tx.amount,
            description=tx.description,
            reference=tx.reference,
            created_at=tx.created_at
        ) for tx in txs
    ]
