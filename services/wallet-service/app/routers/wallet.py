from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
import uuid

from app.database import get_db
from app.models import Wallet, Transaction
from app.schemas import (
    DepositRequest, WithdrawRequest,
    ReserveRequest, ReleaseRequest,
    DebitRequest, CreditRequest,
)

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


# ── Helpers ───────────────────────────────────────────────────────────────────

async def get_or_create_wallet(user_id: str, db: AsyncSession) -> Wallet:
    result = await db.execute(
        select(Wallet).where(Wallet.user_id == uuid.UUID(user_id))
    )
    wallet = result.scalar_one_or_none()

    if not wallet:
        wallet = Wallet(
            user_id = uuid.UUID(user_id),
            balance = Decimal("10000.00"),  # Welcome bonus — R10,000
            margin  = Decimal("0"),
        )
        db.add(wallet)
        # Record welcome bonus transaction
        tx = Transaction(
            user_id     = uuid.UUID(user_id),
            type        = "WELCOME_BONUS",
            amount      = Decimal("10000.00"),
            description = "Welcome bonus — start trading",
        )
        db.add(tx)
        await db.commit()
        await db.refresh(wallet)

    return wallet


def wallet_response(wallet: Wallet) -> dict:
    balance   = Decimal(str(wallet.balance))
    margin    = Decimal(str(wallet.margin))
    available = balance - margin
    return {
        "id":        str(wallet.id),
        "user_id":   str(wallet.user_id),
        "balance":   float(balance),
        "margin":    float(margin),
        "available": float(available),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("")
async def get_wallet(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    wallet = await get_or_create_wallet(x_user_id, db)
    return wallet_response(wallet)


@router.post("/deposit")
async def deposit(
    data: DepositRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    wallet = await get_or_create_wallet(x_user_id, db)
    wallet.balance = Decimal(str(wallet.balance)) + data.amount

    tx = Transaction(
        user_id     = uuid.UUID(x_user_id),
        type        = "DEPOSIT",
        amount      = data.amount,
        description = f"Deposit of R{data.amount}",
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return wallet_response(wallet)


@router.post("/withdraw")
async def withdraw(
    data: WithdrawRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    wallet = await get_or_create_wallet(x_user_id, db)
    available = Decimal(str(wallet.balance)) - Decimal(str(wallet.margin))

    if data.amount > available:
        raise HTTPException(status_code=400, detail="Insufficient available balance")

    wallet.balance = Decimal(str(wallet.balance)) - data.amount

    tx = Transaction(
        user_id     = uuid.UUID(x_user_id),
        type        = "WITHDRAW",
        amount      = -data.amount,
        description = f"Withdrawal of R{data.amount}",
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return wallet_response(wallet)


@router.get("/history")
async def history(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == uuid.UUID(x_user_id))
        .order_by(Transaction.created_at.desc())
        .limit(50)
    )
    transactions = result.scalars().all()
    return [
        {
            "id":          str(tx.id),
            "type":        tx.type,
            "amount":      float(tx.amount),
            "description": tx.description,
            "reference":   tx.reference,
            "created_at":  tx.created_at.isoformat(),
        }
        for tx in transactions
    ]


@router.post("/reserve")
async def reserve_margin(
    data: ReserveRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Called by trading-service when a trade is placed"""
    wallet = await get_or_create_wallet(x_user_id, db)
    available = Decimal(str(wallet.balance)) - Decimal(str(wallet.margin))

    if data.amount > available:
        raise HTTPException(status_code=400, detail="Insufficient available balance")

    wallet.margin = Decimal(str(wallet.margin)) + data.amount

    tx = Transaction(
        user_id     = uuid.UUID(x_user_id),
        type        = "MARGIN_RESERVE",
        amount      = -data.amount,
        description = f"Margin reserved",
        reference   = data.reference,
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return wallet_response(wallet)


@router.post("/release")
async def release_margin(
    data: ReleaseRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Called by trading-service when a trade is closed"""
    wallet = await get_or_create_wallet(x_user_id, db)

    wallet.margin  = max(Decimal("0"), Decimal(str(wallet.margin)) - data.amount)
    wallet.balance = Decimal(str(wallet.balance)) + data.pnl

    tx = Transaction(
        user_id     = uuid.UUID(x_user_id),
        type        = "MARGIN_RELEASE",
        amount      = data.amount,
        description = f"Margin released — P&L: R{data.pnl}",
        reference   = data.reference,
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return wallet_response(wallet)


@router.post("/debit")
async def debit(
    data: DebitRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Called by orbitbet-service when a bet is placed"""
    wallet = await get_or_create_wallet(x_user_id, db)
    available = Decimal(str(wallet.balance)) - Decimal(str(wallet.margin))

    if data.amount > available:
        raise HTTPException(status_code=400, detail="Insufficient available balance")

    wallet.balance = Decimal(str(wallet.balance)) - data.amount

    tx = Transaction(
        user_id     = uuid.UUID(x_user_id),
        type        = "BET_DEBIT",
        amount      = -data.amount,
        description = "Bet stake deducted",
        reference   = data.reference,
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return wallet_response(wallet)


@router.post("/credit")
async def credit(
    data: CreditRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Called by orbitbet-service when a bet is won"""
    wallet = await get_or_create_wallet(x_user_id, db)
    wallet.balance = Decimal(str(wallet.balance)) + data.amount

    tx = Transaction(
        user_id     = uuid.UUID(x_user_id),
        type        = "BET_WIN",
        amount      = data.amount,
        description = "Bet payout credited",
        reference   = data.reference,
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return wallet_response(wallet)