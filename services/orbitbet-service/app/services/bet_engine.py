import random
import httpx
from decimal import Decimal

MULTIPLIER     = Decimal("1.85")
MIN_STAKE      = Decimal("10")
MAX_STAKE      = Decimal("10000")

# XP rewards
XP_WIN         = 50
XP_LOSS        = 10
XP_PER_LEVEL   = 500

# Streak milestones
STREAK_MILESTONES = [3, 5, 10]


async def get_current_price(symbol: str) -> float:
    """Fetch live price from trading service"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"http://trading-service:8000/api/prices/{symbol}")
            data = res.json()
            return float(data.get("price", 0))
    except Exception:
        # Fallback prices
        fallback = {
            "BTC/USD": 67000,
            "ETH/USD": 2100,
            "USD/ZAR": 18.0,
            "EUR/USD": 1.08,
        }
        return fallback.get(symbol, 100)


def resolve_round(direction: str, entry_price: float, current_price: float) -> str:
    """Resolve a single round based on price movement"""
    if direction == "UP":
        return "WIN" if current_price > entry_price else "LOSS"
    else:
        return "WIN" if current_price < entry_price else "LOSS"


def calculate_payout(stake: Decimal, wins: int) -> Decimal:
    """Win 2 of 3 rounds → payout at 1.85x stake"""
    if wins >= 2:
        return round(stake * MULTIPLIER, 2)
    return Decimal("0")


def calculate_xp(won: bool, win_streak: int) -> int:
    """XP = base + streak bonus"""
    if won:
        streak_bonus = min(win_streak * 10, 100)
        return XP_WIN + streak_bonus
    return XP_LOSS


def get_level(xp: int) -> int:
    return xp // XP_PER_LEVEL + 1


def is_near_miss(round_1: str, round_2: str) -> bool:
    """1-1 going into round 3 = near miss"""
    results = [round_1, round_2]
    wins   = results.count("WIN")
    losses = results.count("LOSS")
    return wins == 1 and losses == 1


def get_streak_milestone(streak: int) -> dict | None:
    if streak in STREAK_MILESTONES:
        messages = {
            3:  {"title": "ON FIRE",     "message": "3 wins in a row — you're on a roll!"},
            5:  {"title": "HOT STREAK",  "message": "5 consecutive wins — unstoppable!"},
            10: {"title": "LEGENDARY",   "message": "10 win streak — you are the market!"},
        }
        return messages.get(streak)
    return None