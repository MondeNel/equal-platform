import uuid
from sqlalchemy import (
    Column,
    String,
    Numeric,
    Integer,
    DateTime,
    CheckConstraint,
    Index,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


VALID_DIRECTIONS = ("UP", "DOWN")
VALID_RESULTS = ("WIN", "LOSS")
VALID_STATUSES = ("ACTIVE", "WON", "LOST")


class Bet(Base):
    __tablename__ = "bets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    symbol = Column(String(20), nullable=False)
    direction = Column(String(5), nullable=False)
    stake = Column(Numeric(18, 4), nullable=False)
    multiplier = Column(Numeric(6, 2), nullable=False, default=1.85)

    current_step = Column(Integer, nullable=False, default=0)

    round_1 = Column(String(5), nullable=True)
    round_2 = Column(String(5), nullable=True)
    round_3 = Column(String(5), nullable=True)

    round_1_price = Column(Numeric(18, 6), nullable=True)
    round_2_price = Column(Numeric(18, 6), nullable=True)
    round_3_price = Column(Numeric(18, 6), nullable=True)

    round_1_exit_price = Column(Numeric(18, 6), nullable=True)
    round_2_exit_price = Column(Numeric(18, 6), nullable=True)
    round_3_exit_price = Column(Numeric(18, 6), nullable=True)

    status = Column(String(10), nullable=False, default="ACTIVE")
    payout = Column(Numeric(18, 4), nullable=True)

    reservation_id = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_step_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint(f"direction IN {VALID_DIRECTIONS}", name="check_direction_valid"),
        CheckConstraint(f"status IN {VALID_STATUSES}", name="check_status_valid"),
        CheckConstraint("stake >= 10.00 AND stake <= 10000.00", name="check_stake_range"),
        CheckConstraint("current_step BETWEEN 0 AND 3", name="check_step_range"),
        Index("idx_bets_user_status", "user_id", "status"),
        Index("idx_bets_created_at", "created_at"),
    )


class PlayerStats(Base):
    __tablename__ = "player_stats"

    user_id = Column(UUID(as_uuid=True), primary_key=True)

    win_streak = Column(Integer, nullable=False, default=0)
    max_streak = Column(Integer, nullable=False, default=0)
    login_streak = Column(Integer, nullable=False, default=0)
    best_login_streak = Column(Integer, nullable=False, default=0)

    total_bets = Column(Integer, nullable=False, default=0)
    total_wins = Column(Integer, nullable=False, default=0)
    total_losses = Column(Integer, nullable=False, default=0)
    total_volume = Column(Numeric(18, 2), nullable=False, default=0)

    xp = Column(Integer, nullable=False, default=0)
    level = Column(Integer, nullable=False, default=1)

    orbit_wins = Column(Integer, nullable=False, default=0)
    orbit_losses = Column(Integer, nullable=False, default=0)
    best_win_streak = Column(Integer, nullable=False, default=0)
    total_payout = Column(Numeric(18, 2), nullable=False, default=0)

    last_played = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("win_streak >= 0", name="check_win_streak_positive"),
        CheckConstraint("total_bets >= 0", name="check_total_bets_positive"),
        Index("idx_player_stats_win_streak", "win_streak"),
    )

    def update_level(self):
        new_level = (self.xp // 500) + 1
        if new_level != self.level:
            self.level = new_level
        return self.level

    def add_xp(self, amount: int):
        self.xp += amount
        self.update_level()


def record_win(self, payout: float):
    self.win_streak += 1
    self.total_wins += 1
    self.orbit_wins += 1
    # Convert payout to Decimal before adding
    from decimal import Decimal
    self.total_payout = self.total_payout + Decimal(str(payout))
    if self.win_streak > self.best_win_streak:
        self.best_win_streak = self.win_streak
    if self.win_streak > self.max_streak:
        self.max_streak = self.win_streak

    def record_loss(self):
        self.win_streak = 0
        self.total_losses += 1
        self.orbit_losses += 1