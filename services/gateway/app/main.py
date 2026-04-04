from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

@app.get("/")
async def root():
    return {"service": "eQual Gateway", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "gateway"}

# Import router after app creation to avoid circular imports
try:
    from app.router import router
    app.include_router(router)
except ImportError as e:
    print(f"Router import error: {e}")
