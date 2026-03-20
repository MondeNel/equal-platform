import uuid
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ArbOpportunity(Base):
    __tablename__ = "arb_opportunities"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol           = Column(String, nullable=False)
    buy_exchange     = Column(String, nullable=False)
    sell_exchange    = Column(String, nullable=False)
    buy_price        = Column(Numeric(18, 6))
    sell_price       = Column(Numeric(18, 6))
    spread           = Column(Numeric(18, 6))
    spread_pct       = Column(Numeric(8, 4))
    estimated_profit = Column(Numeric(18, 4))
    is_active        = Column(Boolean, default=True)
    detected_at      = Column(DateTime(timezone=True), server_default=func.now())
    expires_at       = Column(DateTime(timezone=True), nullable=True)


class ArbTrade(Base):
    __tablename__ = "arb_trades"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), nullable=False, index=True)
    opportunity_id = Column(UUID(as_uuid=True), nullable=True)
    symbol         = Column(String, nullable=False)
    buy_exchange   = Column(String, nullable=False)
    sell_exchange  = Column(String, nullable=False)
    amount         = Column(Numeric(18, 4))
    coin_quantity  = Column(Numeric(18, 8))
    buy_price      = Column(Numeric(18, 6))
    sell_price     = Column(Numeric(18, 6))
    spread         = Column(Numeric(18, 6))
    fees           = Column(Numeric(18, 4))
    actual_profit  = Column(Numeric(18, 4))
    status         = Column(String, default="EXECUTED")
    created_at     = Column(DateTime(timezone=True), server_default=func.now())