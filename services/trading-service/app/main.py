from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import os

from app.database import engine, Base
from app.routers.prices import router as prices_router
from app.routers.orders import router as orders_router
from app.routers.trades import router as trades_router
from app.routers.peter import router as peter_router
from app.services.price_service import fast_simulation_ticker, DEFAULT_PRICES, _prices

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize prices with defaults
    for sym, price in DEFAULT_PRICES.items():
        _prices[sym] = price
    
    # Start only the simulation ticker
    sim_task = asyncio.create_task(fast_simulation_ticker())
    yield
    sim_task.cancel()

app = FastAPI(title="eQual Trading Service", version="1.0.0", lifespan=lifespan)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5170").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prices_router)
app.include_router(orders_router)
app.include_router(trades_router)
app.include_router(peter_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "trading"}