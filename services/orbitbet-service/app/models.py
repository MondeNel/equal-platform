import uuid
from sqlalchemy import Column, String, Numeric, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class Bet(Base):
    __tablename__ = "bets"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id      = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol       = Column(String, nullable=False)
    direction    = Column(String, nullable=False)
    stake        = Column(Numeric(18, 4), nullable=False)
    multiplier   = Column(Numeric(5, 2), default=1.00) 

    current_step = Column(Integer, default=1) 
    round_1      = Column(String, nullable=True) 
    round_2      = Column(String, nullable=True) 
    round_3      = Column(String, nullable=True) # Critical Addition
    
    status       = Column(String, default="ACTIVE") 
    payout       = Column(Numeric(18, 4), nullable=True, default=0.0000)
    entry_price  = Column(Numeric(18, 6), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at  = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

class PlayerStats(Base):
    __tablename__ = "player_stats"

    user_id      = Column(UUID(as_uuid=True), primary_key=True)
    win_streak   = Column(Integer, default=0) 
    max_streak   = Column(Integer, default=0) 
    total_wins   = Column(Integer, default=0)
    total_bets   = Column(Integer, default=0)
    last_played  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())