import uuid
from sqlalchemy import Column, String, Numeric, Integer, DateTime, Date, func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class PendingOrder(Base):
    __tablename__ = "pending_orders"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol      = Column(String, nullable=False)
    direction   = Column(String, nullable=False)
    lot_size    = Column(String, nullable=False)
    volume      = Column(Integer, default=1)
    entry_price = Column(Numeric(18, 6), nullable=False)
    take_profit = Column(Numeric(18, 6), nullable=True)
    stop_loss   = Column(Numeric(18, 6), nullable=True)
    margin      = Column(Numeric(18, 4), nullable=False)
    status      = Column(String, default="PENDING")
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class OpenTrade(Base):
    __tablename__ = "open_trades"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol      = Column(String, nullable=False)
    direction   = Column(String, nullable=False)
    lot_size    = Column(String, nullable=False)
    volume      = Column(Integer, default=1)
    entry_price = Column(Numeric(18, 6), nullable=False)
    take_profit = Column(Numeric(18, 6), nullable=True)
    stop_loss   = Column(Numeric(18, 6), nullable=True)
    margin      = Column(Numeric(18, 4), nullable=False)
    opened_at   = Column(DateTime(timezone=True), server_default=func.now())


class TradeHistory(Base):
    __tablename__ = "trade_history"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id      = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol       = Column(String, nullable=False)
    direction    = Column(String, nullable=False)
    lot_size     = Column(String, nullable=False)
    volume       = Column(Integer, default=1)
    entry_price  = Column(Numeric(18, 6), nullable=False)
    close_price  = Column(Numeric(18, 6), nullable=False)
    take_profit  = Column(Numeric(18, 6), nullable=True)
    stop_loss    = Column(Numeric(18, 6), nullable=True)
    pnl          = Column(Numeric(18, 4), nullable=False)
    close_reason = Column(String, nullable=False)
    opened_at    = Column(DateTime(timezone=True), nullable=False)
    closed_at    = Column(DateTime(timezone=True), server_default=func.now())


class PeterUsage(Base):
    __tablename__ = "peter_usage"

    id      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    date    = Column(Date, server_default=func.current_date())
    uses    = Column(Integer, default=0)
