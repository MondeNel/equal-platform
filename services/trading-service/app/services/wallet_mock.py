# services/trading-service/app/services/wallet_mock.py
import logging
logger = logging.getLogger(__name__)

async def reserve_margin(user_id: str, amount: float, reference: str):
    logger.info(f"MOCK: Reserving {amount} for user {user_id}, ref {reference}")
    return True

async def release_margin(user_id: str, reference: str, pnl: float):
    logger.info(f"MOCK: Releasing {reference} with PnL {pnl}")
    return True