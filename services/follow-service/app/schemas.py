from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


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
    trader_id:        str
    original_trade_id:str
    symbol:           str
    direction:        str
    lot_size:         str
    volume:           int = 1