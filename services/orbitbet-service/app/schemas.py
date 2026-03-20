from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class PlaceBetRequest(BaseModel):
    symbol:    str
    direction: str   # UP or DOWN
    stake:     Decimal


class ResolveBetRequest(BaseModel):
    bet_id: str