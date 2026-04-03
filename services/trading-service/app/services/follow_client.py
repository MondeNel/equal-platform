import httpx
import logging
from decimal import Decimal
from typing import Dict, Any

logger = logging.getLogger(__name__)

FOLLOW_SERVICE_URL = "http://follow-service:8000"
REQUEST_TIMEOUT = 10.0


async def notify_trade(trader_id: str, original_trade_id: str, symbol: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(
            f"{FOLLOW_SERVICE_URL}/api/trade/notify",
            json={
                "trader_id": trader_id,
                "original_trade_id": original_trade_id,
                "symbol": symbol
            },
            headers={"X-User-ID": trader_id}
        )
        response.raise_for_status()
        return response.json()


async def check_copy_limit(user_id: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.get(
            f"{FOLLOW_SERVICE_URL}/api/copy/limit",
            headers={"X-User-ID": user_id}
        )
        response.raise_for_status()
        return response.json()


async def record_copy_trade(
    follower_id: str,
    trader_id: str,
    original_trade_id: str,
    symbol: str,
    lot_size: str,
    volume: int
) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(
            f"{FOLLOW_SERVICE_URL}/api/copy",
            json={
                "trader_id": trader_id,
                "original_trade_id": original_trade_id,
                "symbol": symbol,
                "lot_size": lot_size,
                "volume": volume
            },
            headers={"X-User-ID": follower_id}
        )
        response.raise_for_status()
        return response.json()


async def close_copy_trade(follower_id: str, copy_trade_id: str, profit: Decimal) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(
            f"{FOLLOW_SERVICE_URL}/api/copy/close",
            json={
                "copy_trade_id": copy_trade_id,
                "profit": float(profit)
            },
            headers={"X-User-ID": follower_id}
        )
        response.raise_for_status()
        return response.json()
