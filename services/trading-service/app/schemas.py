from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime
from uuid import UUID

class PlaceOrderRequest(BaseModel):
    symbol: str
    direction: str
    lot_size: str
    volume: int = 1
    entry_price: Decimal
    take_profit: Optional[Decimal] = None
    stop_loss: Optional[Decimal] = None

class ActivateOrderRequest(BaseModel):
    activation_price: Decimal

class CloseTradeRequest(BaseModel):
    close_price: Optional[Decimal] = None
    close_reason: str = "MANUAL"

class OrderResponse(BaseModel):
    id: UUID
    symbol: str
    direction: str
    lot_size: str
    volume: int
    entry_price: float
    take_profit: Optional[float]
    stop_loss: Optional[float]
    margin: float
    status: str
    created_at: datetime

class TradeResponse(BaseModel):
    id: UUID
    symbol: str
    direction: str
    lot_size: str
    volume: int
    entry_price: float
    take_profit: Optional[float]
    stop_loss: Optional[float]
    current_price: Optional[float]
    pnl: float
    margin: float
    opened_at: datetime

class TradeHistoryResponse(BaseModel):
    id: UUID
    symbol: str
    direction: str
    lot_size: str
    volume: int
    entry_price: float
    close_price: float
    pnl: float
    close_reason: str
    opened_at: datetime
    closed_at: datetime

class PlayerStatsResponse(BaseModel):
    win_streak: int
    max_streak: int
    total_wins: int
    total_losses: int
    total_bets: int
