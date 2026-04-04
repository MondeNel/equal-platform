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

class ProfitEstimateResponse(BaseModel):
    """Profit estimation for a potential arbitrage trade"""
    symbol: str
    buy_exchange: str
    sell_exchange: str
    buy_price: float
    sell_price: float
    spread: float
    spread_pct: float
    amount_zar: float
    amount_usd: float
    coin_quantity: float
    gross_profit_zar: float
    exchange_fees_zar: float
    platform_fee_zar: float
    total_fees_zar: float
    net_profit_zar: float
    estimated_payout_zar: float
    fee_breakdown: dict

class LimitOrderRequest(BaseModel):
    symbol: str
    buy_exchange: str
    sell_exchange: str
    amount: Decimal
    target_buy_price: float  # Target price on buy exchange (simplified)
    expires_in_minutes: int = 60
    opportunity_id: Optional[str] = None


class LimitOrderResponse(BaseModel):
    id: str
    symbol: str
    buy_exchange: str
    sell_exchange: str
    amount: Decimal
    target_buy_price: float
    status: str
    expires_at: datetime
    created_at: datetime
    executed_at: Optional[datetime] = None
    executed_profit: Optional[float] = None
