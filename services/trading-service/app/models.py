import uuid
from sqlalchemy import Column, String, Numeric, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class PendingOrder(Base):
    __tablename__ = "pending_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol = Column(String, nullable=False)
    direction = Column(String, nullable=False)
    lot_size = Column(String, nullable=False)
    volume = Column(Integer, default=1)
    entry_price = Column(Numeric(18, 6), nullable=False)
    take_profit = Column(Numeric(18, 6), nullable=True)
    stop_loss = Column(Numeric(18, 6), nullable=True)
    margin = Column(Numeric(18, 4), nullable=False)
    status = Column(String, default="PENDING")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class OpenTrade(Base):
    __tablename__ = "open_trades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol = Column(String, nullable=False)
    direction = Column(String, nullable=False)
    lot_size = Column(String, nullable=False)
    volume = Column(Integer, default=1)
    entry_price = Column(Numeric(18, 6), nullable=False)
    take_profit = Column(Numeric(18, 6), nullable=True)
    stop_loss = Column(Numeric(18, 6), nullable=True)
    margin = Column(Numeric(18, 4), nullable=False)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())


class TradeHistory(Base):
    __tablename__ = "trade_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol = Column(String, nullable=False)
    direction = Column(String, nullable=False)
    lot_size = Column(String, nullable=False)
    volume = Column(Integer, default=1)
    entry_price = Column(Numeric(18, 6), nullable=False)
    close_price = Column(Numeric(18, 6), nullable=False)
    take_profit = Column(Numeric(18, 6), nullable=True)
    stop_loss = Column(Numeric(18, 6), nullable=True)
    pnl = Column(Numeric(18, 4), nullable=False)
    close_reason = Column(String, nullable=False)
    opened_at = Column(DateTime(timezone=True), nullable=False)
    closed_at = Column(DateTime(timezone=True), server_default=func.now())


class PlayerStats(Base):
    __tablename__ = "player_stats"

    user_id = Column(UUID(as_uuid=True), primary_key=True)
    win_streak = Column(Integer, default=0)
    max_streak = Column(Integer, default=0)
    total_wins = Column(Integer, default=0)
    total_losses = Column(Integer, default=0)
    total_bets = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
