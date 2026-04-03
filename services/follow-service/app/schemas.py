from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class UpdateTraderStatsRequest(BaseModel):
    display_name:   Optional[str] = None
    country:        Optional[str] = None
    total_trades:   Optional[int] = None
    winning_trades: Optional[int] = None
    total_pnl:      Optional[Decimal] = None
    is_live:        Optional[bool] = None
    live_symbol:    Optional[str] = None
    live_direction: Optional[str] = None
    live_pnl:       Optional[Decimal] = None


class CopyTradeRequest(BaseModel):
    trader_id:         str
    original_trade_id: str
    symbol:            str
    lot_size:          str
    volume:            int = 1
    # direction is NOT provided by follower; trading app will fetch it from original trade


class SubscribeRequest(BaseModel):
    plan: str = "monthly"


class CopyLimitResponse(BaseModel):
    can_copy: bool
    free_copies_used: int
    daily_free_limit: int
    subscription_active: bool
    next_reset_date: Optional[str] = None
    message: Optional[str] = None


class CloseCopyTradeRequest(BaseModel):
    copy_trade_id: str
    profit: Decimal


class TradeNotificationRequest(BaseModel):
    trader_id:         str
    original_trade_id: str
    symbol:            str


class TradeNotificationResponse(BaseModel):
    id: str
    trader_id: str
    symbol: str
    original_trade_id: str
    created_at: datetime
