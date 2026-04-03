"""
Wallet service client for real HTTP calls.
"""
import logging
import httpx
from decimal import Decimal
from typing import Dict, Any
from fastapi import HTTPException

logger = logging.getLogger(__name__)

WALLET_SERVICE_URL = "http://wallet-service:8000"
REQUEST_TIMEOUT = 10.0


async def reserve_stake(user_id: str, amount: Decimal, reference: str) -> Dict[str, Any]:
    """
    Reserve stake amount in wallet.
    Raises HTTPException if insufficient balance.
    """
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await client.post(
                f"{WALLET_SERVICE_URL}/api/wallet/reserve",
                json={"amount": float(amount), "reference": reference},
                headers={"X-User-ID": user_id}
            )
            if response.status_code != 200:
                error_detail = response.json().get("detail", "Reservation failed")
                logger.error(f"Wallet reserve failed: {error_detail}")
                raise HTTPException(status_code=400, detail=error_detail)
            return response.json()
        except httpx.RequestError as e:
            logger.error(f"Wallet service unreachable: {e}")
            raise HTTPException(status_code=503, detail="Wallet service unavailable")


async def release_stake(user_id: str, amount: Decimal, reference: str, pnl: Decimal) -> bool:
    """
    Release reserved stake and apply PnL (positive or negative).
    Returns True on success.
    """
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await client.post(
                f"{WALLET_SERVICE_URL}/api/wallet/release",
                json={"amount": float(amount), "reference": reference, "pnl": float(pnl)},
                headers={"X-User-ID": user_id}
            )
            if response.status_code != 200:
                logger.error(f"Wallet release failed: {response.text}")
                return False
            return True
        except httpx.RequestError as e:
            logger.error(f"Wallet service unreachable during release: {e}")
            return False