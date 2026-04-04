from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class ExecuteArbRequest(BaseModel):
    symbol: str
    buy_exchange: str
    sell_exchange: str
    amount: Decimal
    opportunity_id: Optional[str] = None


class LimitOrderRequest(BaseModel):
    symbol: str
    buy_exchange: str
    sell_exchange: str
    amount: Decimal
    target_spread_pct: float
    expires_in_minutes: int = 60
    opportunity_id: Optional[str] = None


class LimitOrderResponse(BaseModel):
    id: str
    symbol: str
    buy_exchange: str
    sell_exchange: str
    amount: Decimal
    target_spread_pct: float
    status: str
    expires_at: datetime
    created_at: datetime
    executed_at: Optional[datetime] = None
    executed_profit: Optional[float] = None
