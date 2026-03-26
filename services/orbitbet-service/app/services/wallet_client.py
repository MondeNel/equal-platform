"""
Wallet service client for stake reservation and settlement.
Mock implementation for testing.
"""
import logging
from decimal import Decimal
from typing import Dict, Any

logger = logging.getLogger(__name__)

WALLET_SERVICE_URL = "http://wallet-service:8000"
REQUEST_TIMEOUT = 5.0


async def reserve_stake(user_id: str, amount: Decimal, reference: str) -> Dict[str, Any]:
    """Mock implementation for testing"""
    logger.info(f"Mock: Reserving stake {amount} for user {user_id}, reference: {reference}")
    return {"success": True, "reservation_id": reference}


async def release_stake(user_id: str, reservation_id: str, settle_loss: bool = False) -> bool:
    """Mock implementation for testing"""
    logger.info(f"Mock: Releasing stake {reservation_id} for user {user_id}, settle_loss={settle_loss}")
    return True


async def credit_winnings(user_id: str, amount: Decimal, reference: str) -> bool:
    """Mock implementation for testing"""
    logger.info(f"Mock: Crediting winnings {amount} to user {user_id}, reference: {reference}")
    return True
