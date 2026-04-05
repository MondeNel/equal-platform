from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers.arb import router as arb_router
from app.routers.limit_orders import router as limit_router
from app.services.websocket_manager import manager
from app.services.limit_order_worker import start_worker
import asyncio
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Start background worker
    worker_task = asyncio.create_task(start_worker())
    
    yield
    
    worker_task.cancel()


app = FastAPI(title="eQual Arbitrage Service", version="1.0.0", lifespan=lifespan)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5170,http://localhost:5171,http://localhost:5172,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(arb_router)
app.include_router(limit_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "arbitrage"}


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive with ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
