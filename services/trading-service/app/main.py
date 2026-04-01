from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import os

from app.database import engine, Base
from app.routers.orders import router as orders_router
from app.routers.trades import router as trades_router
from app.routers.prices import router as prices_router
from app.routers.prices import price_updater
from app.routers.stats import router as stats_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Start price updater
    asyncio.create_task(price_updater())
    yield

app = FastAPI(title="eQual Trading Service", version="1.0.0", lifespan=lifespan)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5170").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders_router)
app.include_router(trades_router)
app.include_router(prices_router)
app.include_router(stats_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "trading"}
