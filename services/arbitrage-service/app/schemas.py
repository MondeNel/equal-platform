from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class ExecuteArbRequest(BaseModel):
    symbol:        str
    buy_exchange:  str
    sell_exchange: str
    amount:        Decimal
    opportunity_id: Optional[str] = None