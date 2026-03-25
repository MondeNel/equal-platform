from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers.bet import router as bet_router
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- AUTO-MIGRATION ON STARTUP ---
    # This creates the tables (bets, player_stats) if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="eQual OrbitBet Service", version="1.0.0", lifespan=lifespan)

# Broaden origins for local dev if necessary
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5170,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bet_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "orbitbet"}