import uuid
from sqlalchemy import Column, String, Numeric, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class Wallet(Base):
    __tablename__ = "wallets"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    balance    = Column(Numeric(18, 4), default=0)
    margin     = Column(Numeric(18, 4), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Transaction(Base):
    __tablename__ = "transactions"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), nullable=False, index=True)
    type        = Column(String, nullable=False)
    amount      = Column(Numeric(18, 4), nullable=False)
    description = Column(String, nullable=True)
    reference   = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())