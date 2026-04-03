import logging
import httpx
from decimal import Decimal
from typing import Dict, Any
from fastapi import HTTPException

logger = logging.getLogger(__name__)

WALLET_SERVICE_URL = "http://wallet-service:8000"
REQUEST_TIMEOUT = 10.0


async def debit_wallet(user_id: str, amount: Decimal, reference: str) -> bool:
    """Debit user's wallet (for subscription payment)."""
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await client.post(
                f"{WALLET_SERVICE_URL}/api/wallet/debit",
                json={"amount": float(amount), "reference": reference},
                headers={"X-User-ID": user_id}
            )
            if response.status_code != 200:
                logger.error(f"Wallet debit failed: {response.text}")
                return False
            return True
        except httpx.RequestError as e:
            logger.error(f"Wallet service unreachable: {e}")
            return False


async def credit_wallet(user_id: str, amount: Decimal, reference: str) -> bool:
    """Credit user's wallet (for commission payout)."""
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await client.post(
                f"{WALLET_SERVICE_URL}/api/wallet/credit",
                json={"amount": float(amount), "reference": reference},
                headers={"X-User-ID": user_id}
            )
            if response.status_code != 200:
                logger.error(f"Wallet credit failed: {response.text}")
                return False
            return True
        except httpx.RequestError as e:
            logger.error(f"Wallet service unreachable: {e}")
            return False


async def check_balance(user_id: str, required_amount: Decimal) -> bool:
    """Check if user has sufficient balance."""
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await client.get(
                f"{WALLET_SERVICE_URL}/api/wallet",
                headers={"X-User-ID": user_id}
            )
            if response.status_code != 200:
                return False
            data = response.json()
            balance = Decimal(str(data["available"]))
            return balance >= required_amount
        except:
            return False
