from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.router import router
import os

app = FastAPI(title="eQual Gateway", version="1.0.0")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5170").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "gateway"}