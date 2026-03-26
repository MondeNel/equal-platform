"""
OrbitBet core engine for price simulation, round resolution, and calculations.
"""
import random
import logging
from decimal import Decimal
from typing import Dict, List

logger = logging.getLogger(__name__)

# Constants
BASE_ORBIT_MULTIPLIER = Decimal("1.85")
XP_WIN = 50
XP_LOSS = 10

# Streak bonuses
STREAK_BONUSES: Dict[int, Decimal] = {
    3: Decimal("0.10"),   # 10% bonus
    6: Decimal("0.20"),   # 20% bonus
    9: Decimal("0.30"),   # 30% bonus
    12: Decimal("0.40"),  # 40% bonus
    15: Decimal("0.50"),  # 50% bonus
    18: Decimal("0.60"),  # 60% bonus
}

# Simulated price rotation for testing
TEST_MODE_PRICES: Dict[str, List[float]] = {
    "BTC/USD": [67000.0, 67001.2, 67000.8, 67002.5, 67001.5, 67003.0],
    "ETH/USD": [2100.0, 2101.5, 2099.8, 2102.0, 2100.5, 2103.0],
    "USD/ZAR": [18.25, 18.27, 18.24, 18.29, 18.26, 18.31],
}

_price_index: Dict[str, int] = {}


async def get_current_price(symbol: str, test_mode: bool = True) -> float:
    """
    Fetch current price. In test_mode, rotates through predefined prices.
    """
    try:
        if test_mode:
            # Get or initialize price index for this symbol
            if symbol not in _price_index:
                _price_index[symbol] = 0
            
            # Get price list for symbol or use default
            prices = TEST_MODE_PRICES.get(symbol, [100.0, 100.1, 99.9, 100.2])
            
            # Get current price
            price = prices[_price_index[symbol] % len(prices)]
            _price_index[symbol] += 1
            
            # Add small random noise for realism
            noise = random.uniform(-0.05, 0.05)
            price += noise
            
            result = round(price, 4)
            logger.debug(f"Price for {symbol}: {result}")
            return result
        
        # Real fetch code - to be implemented with CoinGecko
        import httpx
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"http://trading-service:8000/api/prices/{symbol}")
            data = res.json()
            price = float(data.get("price", 0))
            if price <= 0:
                raise ValueError("Invalid price")
            return price
            
    except Exception as e:
        logger.error(f"Price fetch failed: {e}")
        # Fallback to a default price
        return 100.0


def resolve_round(direction: str, entry_price: float, current_price: float) -> str:
    """
    Determine round outcome.
    """
    entry = round(float(entry_price), 6)
    current = round(float(current_price), 6)
    direction = direction.upper()
    
    if current == entry:
        return "WIN"
    if direction == "UP":
        return "WIN" if current > entry else "LOSS"
    if direction == "DOWN":
        return "WIN" if current < entry else "LOSS"
    return "LOSS"


def calculate_streak_bonus(streak: int) -> Decimal:
    """Calculate streak bonus percentage."""
    for milestone in sorted(STREAK_BONUSES.keys(), reverse=True):
        if streak >= milestone:
            return STREAK_BONUSES[milestone]
    return Decimal("0.00")


def calculate_final_payout_with_streak(stake: Decimal, streak: int) -> Decimal:
    """Calculate final payout including streak bonus."""
    base_payout = stake * BASE_ORBIT_MULTIPLIER
    streak_bonus_pct = calculate_streak_bonus(streak)
    total_payout = base_payout * (Decimal("1.00") + streak_bonus_pct)
    return total_payout.quantize(Decimal("0.01"))


def calculate_xp(won: bool, win_streak: int) -> int:
    """Calculate XP earned from a completed bet."""
    if won:
        streak_bonus = min(win_streak * 10, 100)
        return XP_WIN + streak_bonus
    return XP_LOSS