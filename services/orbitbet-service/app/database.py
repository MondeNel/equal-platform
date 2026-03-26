import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.exc import OperationalError
from sqlalchemy import text

DATABASE_URL = os.getenv(
    "ORBITBET_DB_URL",
    "postgresql+asyncpg://equal:equal2026@orbitbet-db:5432/orbitbet_db"
)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def wait_for_db(retries: int = 15, delay: int = 3):
    """Wait for database to be ready and create tables."""
    for attempt in range(1, retries + 1):
        try:
            async with engine.begin() as conn:
                # Test connection
                await conn.execute(text("SELECT 1"))
                # Create tables
                await conn.run_sync(Base.metadata.create_all)
            print(f"✅ Database connection successful (attempt {attempt})")
            return
        except OperationalError as e:
            print(f"⚠️ DB connection failed (attempt {attempt}/{retries}): {e}")
            if attempt < retries:
                await asyncio.sleep(delay)
            else:
                raise RuntimeError("❌ Database failed to connect after multiple attempts")