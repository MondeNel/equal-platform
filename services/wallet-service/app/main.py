from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers.wallet import router as wallet_router
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Don't attempt to create tables on startup — let routes handle it
    yield

app = FastAPI(title="eQual Wallet Service", version="1.0.0", lifespan=lifespan)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5170").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wallet_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "wallet"}