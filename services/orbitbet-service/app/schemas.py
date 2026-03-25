from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from uuid import UUID

class PlaceBetRequest(BaseModel):
    symbol: str
    direction: str
    stake: Decimal

    model_config = {
        "from_attributes": True
    }

class ResolveBetRequest(BaseModel):
    bet_id: str

# New schema to ensure frontend gets streak/multiplier data
class BetResponse(BaseModel):
    bet_id: UUID
    result: str
    step: int
    status: str
    streak: int
    multiplier: float
    payout: Optional[Decimal] = Decimal("0.00")

    model_config = {
        "from_attributes": True
    }