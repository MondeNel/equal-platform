import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import wait_for_db
from app.routers.bet import router as bet_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting OrbitBet Service...")
    await wait_for_db()
    logger.info("Database connection established")
    yield
    logger.info("Shutting down OrbitBet Service...")


app = FastAPI(
    title="eQual OrbitBet Service",
    description="Gamified price prediction betting",
    version="1.0.0",
    lifespan=lifespan
)

origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5170,http://localhost:5171,http://localhost:5172,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176"
).split(",")

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
    return {"status": "ok", "service": "orbitbet", "version": "1.0.0"}


@app.get("/")
async def root():
    return {
        "service": "OrbitBet Service",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/api/bet/place",
            "/api/bet/round",
            "/api/bet/active",
            "/api/bet/history",
            "/api/bet/stats"
        ]
    }