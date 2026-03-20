import uuid
from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, Date, func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Bet(Base):
    __tablename__ = "bets"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol      = Column(String, nullable=False)
    direction   = Column(String, nullable=False)  # UP or DOWN
    stake       = Column(Numeric(18, 4), nullable=False)
    multiplier  = Column(Numeric(5, 2), default=1.85)

    # Round results
    round_1     = Column(String, nullable=True)   # WIN or LOSS
    round_2     = Column(String, nullable=True)
    round_3     = Column(String, nullable=True)

    wins        = Column(Integer, default=0)
    losses      = Column(Integer, default=0)
    status      = Column(String, default="ACTIVE")  # ACTIVE, WON, LOST
    payout      = Column(Numeric(18, 4), nullable=True)

    entry_price = Column(Numeric(18, 6), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class PlayerStats(Base):
    __tablename__ = "player_stats"

    user_id      = Column(UUID(as_uuid=True), primary_key=True)
    xp           = Column(Integer, default=0)
    level        = Column(Integer, default=1)
    win_streak   = Column(Integer, default=0)
    best_streak  = Column(Integer, default=0)
    login_streak = Column(Integer, default=0)
    total_bets   = Column(Integer, default=0)
    total_wins   = Column(Integer, default=0)
    last_login   = Column(Date, server_default=func.current_date())
    created_at   = Column(DateTime(timezone=True), server_default=func.now())