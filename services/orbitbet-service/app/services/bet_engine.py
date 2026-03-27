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

# Target RTP
TARGET_RTP = Decimal("0.85")  # 85% return on stake
WIN_PROBABILITY = float(TARGET_RTP / BASE_ORBIT_MULTIPLIER)  # ~0.4595

# Price ranges for different symbols (for visual effect)
SYMBOL_PRICE_RANGES = {
    "BTC/USD": (66000, 69000),
    "ETH/USD": (2000, 2300),
    "USD/ZAR": (18, 20),
}
DEFAULT_RANGE = (100, 200)

def get_win_probability() -> float:
    """Return fixed win probability for each bet."""
    return WIN_PROBABILITY

def determine_outcome() -> bool:
    """Return True for WIN, False for LOSS based on win probability."""
    return random.random() < WIN_PROBABILITY

def generate_round_results(overall_win: bool) -> List[str]:
    """
    Generate a sequence of 3 round results (WIN/LOSS) that lead to the overall outcome.
    Overall win means at least 2 wins. We'll randomly choose a pattern that satisfies.
    """
    if overall_win:
        patterns = [
            ["WIN", "WIN", "LOSS"],
            ["WIN", "LOSS", "WIN"],
            ["LOSS", "WIN", "WIN"],
            ["WIN", "WIN", "WIN"],
        ]
    else:
        patterns = [
            ["WIN", "LOSS", "LOSS"],
            ["LOSS", "WIN", "LOSS"],
            ["LOSS", "LOSS", "WIN"],
            ["LOSS", "LOSS", "LOSS"],
        ]
    return random.choice(patterns)

async def get_current_price(symbol: str, test_mode: bool = True) -> float:
    """
    Return a random price for visual effect.
    """
    low, high = SYMBOL_PRICE_RANGES.get(symbol, DEFAULT_RANGE)
    return round(random.uniform(low, high), 4)

def generate_price_for_round(entry_price: float, direction: str, result: str) -> float:
    """
    Generate an exit price that satisfies the result given the user's direction.
    If result == "WIN", then for direction UP, exit_price > entry_price; for DOWN, exit_price < entry_price.
    If result == "LOSS", the opposite.
    """
    # Determine movement direction based on result and user's direction
    if result == "WIN":
        if direction == "UP":
            movement = random.uniform(0.001, 0.01)   # up 0.1% to 1%
        else:  # DOWN
            movement = random.uniform(-0.01, -0.001) # down 0.1% to 1%
    else:  # LOSS
        if direction == "UP":
            movement = random.uniform(-0.01, -0.001) # down
        else:  # DOWN
            movement = random.uniform(0.001, 0.01)   # up
    exit_price = entry_price * (1 + movement)
    return round(exit_price, 4)

def resolve_round(direction: str, entry_price: float, current_price: float) -> str:
    """
    Determine round outcome based on price movement. (Not used in new logic, but kept for reference.)
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