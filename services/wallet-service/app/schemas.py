from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime
from uuid import UUID

class DepositRequest(BaseModel):
    amount: Decimal

class WithdrawRequest(BaseModel):
    amount: Decimal

class ReserveRequest(BaseModel):
    amount: Decimal
    reference: str

class ReleaseRequest(BaseModel):
    amount: Decimal
    reference: str
    pnl: Decimal = Decimal("0")

class DebitRequest(BaseModel):
    amount: Decimal
    reference: str

class CreditRequest(BaseModel):
    amount: Decimal
    reference: str

class WalletOut(BaseModel):
    id: UUID
    user_id: UUID
    balance: Decimal
    margin: Decimal
    available: Decimal

class TransactionOut(BaseModel):
    id: UUID
    type: str
    amount: Decimal
    description: Optional[str]
    reference: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
