import uuid
from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, func, UniqueConstraint, Date
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class TraderStats(Base):
    __tablename__ = "trader_stats"
    user_id        = Column(UUID(as_uuid=True), primary_key=True)
    display_name   = Column(String(100), nullable=True)
    country        = Column(String(100), default="South Africa")
    currency_symbol= Column(String(5), default="R")
    total_trades   = Column(Integer, default=0)
    winning_trades = Column(Integer, default=0)
    win_rate       = Column(Numeric(5, 2), default=0)
    total_pnl      = Column(Numeric(18, 4), default=0)
    star_rating    = Column(Numeric(3, 2), default=0)
    follower_count = Column(Integer, default=0)
    is_live        = Column(Boolean, default=False)
    live_symbol    = Column(String, nullable=True)
    live_direction = Column(String, nullable=True)
    live_pnl       = Column(Numeric(18, 4), default=0)
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Follow(Base):
    __tablename__ = "follows"
    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    follower_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    trader_id   = Column(UUID(as_uuid=True), nullable=False, index=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("follower_id", "trader_id", name="uq_follow"),)


class CopyTrade(Base):
    __tablename__ = "copy_trades"
    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    follower_id       = Column(UUID(as_uuid=True), nullable=False, index=True)
    trader_id         = Column(UUID(as_uuid=True), nullable=False)
    original_trade_id = Column(UUID(as_uuid=True), nullable=False)
    symbol            = Column(String, nullable=False)
    direction         = Column(String, nullable=False)   # will be set by trading app from original trade
    lot_size          = Column(String, nullable=False)
    volume            = Column(Integer, default=1)
    commission_rate   = Column(Numeric(5, 4), default=0.10)
    status            = Column(String, default="ACTIVE")
    follower_profit   = Column(Numeric(18, 4), nullable=True)
    trader_commission = Column(Numeric(18, 4), nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    closed_at         = Column(DateTime(timezone=True), nullable=True)


class TradeNotification(Base):
    __tablename__ = "trade_notifications"
    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trader_id         = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol            = Column(String, nullable=False)          # only visible info
    original_trade_id = Column(UUID(as_uuid=True), nullable=False)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    expires_at        = Column(DateTime(timezone=True), nullable=True)


class UserCopyStats(Base):
    __tablename__ = "user_copy_stats"
    user_id             = Column(UUID(as_uuid=True), primary_key=True)
    free_copies_used    = Column(Integer, default=0)
    subscription_active = Column(Boolean, default=False)
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    last_reset_date     = Column(Date, server_default=func.current_date(), onupdate=func.current_date())
    daily_free_limit    = Column(Integer, default=2)
    updated_at          = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
