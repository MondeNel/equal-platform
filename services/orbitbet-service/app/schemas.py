"""
Pydantic schemas for OrbitBet service.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from decimal import Decimal
from uuid import UUID
from datetime import datetime

# Type Aliases
Direction = Literal["UP", "DOWN"]
Result = Literal["WIN", "LOSS"]
Status = Literal["ACTIVE", "WON", "LOST"]


# Request Schemas
class PlaceBetRequest(BaseModel):
    """Request to start a new Orbit bet."""
    symbol: str = Field(..., min_length=3, max_length=20)
    direction: Direction
    stake: Decimal = Field(..., gt=0, le=10000)


class ResolveRoundRequest(BaseModel):
    """Request to resolve a single round."""
    bet_id: UUID
    chosen_direction: Direction


# Response Schemas
class BetResponse(BaseModel):
    """Response after placing a bet."""
    bet_id: UUID
    step: int
    status: Status
    round_number: int
    message: str
    stake: float
    symbol: str


class RoundResultResponse(BaseModel):
    """Response after resolving a round."""
    bet_id: UUID
    round_number: int
    result: Result
    entry_price: float
    exit_price: float
    price_movement: float
    next_round: Optional[int] = None
    is_complete: bool
    final_result: Optional[str] = None
    payout: Optional[float] = None
    streak_stats: Optional[dict] = None


class ActiveBetResponse(BaseModel):
    """Response for checking active bet."""
    has_active_bet: bool
    bet_id: Optional[UUID] = None
    symbol: Optional[str] = None
    stake: Optional[float] = None
    current_round: Optional[int] = None
    entry_price: Optional[float] = None
    round_1_result: Optional[str] = None
    round_2_result: Optional[str] = None
    round_3_result: Optional[str] = None
    can_resume: bool = False


class PlayerStatsResponse(BaseModel):
    """Player statistics response."""
    user_id: UUID
    win_streak: int
    max_streak: int
    login_streak: int
    total_bets: int
    total_wins: int
    total_losses: int
    xp: int
    level: int
    orbit_wins: int
    orbit_losses: int
    best_win_streak: int
    total_payout: float
    last_played: datetime


class BetHistoryResponse(BaseModel):
    """Bet history response."""
    id: UUID
    symbol: str
    stake: float
    payout: Optional[float]
    status: Status
    round_1: Optional[str]
    round_2: Optional[str]
    round_3: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]