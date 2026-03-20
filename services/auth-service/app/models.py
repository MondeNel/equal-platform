import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email           = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    display_name    = Column(String(100), nullable=True)
    country         = Column(String(100), default="South Africa")
    currency_code   = Column(String(10),  default="ZAR")
    currency_symbol = Column(String(5),   default="R")
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email}>"