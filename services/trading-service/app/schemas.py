from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime

class PlaceOrderRequest(BaseModel):
    symbol:      str
    direction:   str
    lot_size:    str
    volume:      int = 1
    entry_price: Decimal
    take_profit: Optional[Decimal] = None
    stop_loss:   Optional[Decimal] = None

class ActivateOrderRequest(BaseModel):
    activation_price: Decimal

class CloseTradeRequest(BaseModel):
    close_price:  Optional[Decimal] = None
    close_reason: str = "MANUAL"

class PeterAnalyseRequest(BaseModel):
    symbol:    str
    direction: Optional[str] = None
    entry:     Optional[Decimal] = None
    tp:        Optional[Decimal] = None
    sl:        Optional[Decimal] = None
    price:     Optional[Decimal] = None
    analysis_type: str = "TREND"