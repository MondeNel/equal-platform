import random
import httpx
from decimal import Decimal

# Base multiplier for completing the 2-ring orbit
BASE_ORBIT_MULTIPLIER = Decimal("1.85")

# XP Rewards for B2B gamification
XP_WIN          = 50
XP_LOSS         = 10
XP_PER_LEVEL    = 500

# Updated milestones to match your "Cash Volt" UI (3, 6, 9, 12, 15, 18)
STREAK_BONUSES = {
    3:  Decimal("3.0"),
    6:  Decimal("6.0"),
    9:  Decimal("9.0"),
    12: Decimal("12.0"),
    15: Decimal("15.0"),
    18: Decimal("18.0")
}

async def get_current_price(symbol: str) -> float:
    """Fetch live price with Docker-aware internal DNS and noise-injected fallback."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"http://trading-service:8000/api/prices/{symbol}")
            data = res.json()
            price = float(data.get("price", 0))
            if price <= 0: raise ValueError("Price is zero")
            return price
    except Exception:
        fallback = {
            "BTC/USD": 67000.0, "ETH/USD": 2100.0,
            "USD/ZAR": 18.25,    "EUR/USD": 1.08,
        }
        base = fallback.get(symbol, 100.0)
        # Random noise ensures the UI orbits actually move during dev/testing
        return base + (random.uniform(-0.1, 0.1))

def resolve_round(direction: str, entry_price: float, current_price: float) -> str:
    """Standard binary resolution: WIN if price moved in predicted direction."""
    if direction == "UP":
        return "WIN" if current_price > entry_price else "LOSS"
    return "WIN" if current_price < entry_price else "LOSS"

def calculate_final_payout(stake: Decimal, streak: int) -> Decimal:
    """
    Payout = Stake * 1.85 (Base) * Streak Multiplier (Bonus)
    Only called when the 2nd ring is successfully resolved.
    """
    # Find the highest applicable bonus milestone
    bonus_multi = Decimal("1.0")
    for milestone in sorted(STREAK_BONUSES.keys()):
        if streak >= milestone:
            bonus_multi = STREAK_BONUSES[milestone]
            
    total_multi = BASE_ORBIT_MULTIPLIER * bonus_multi
    return (stake * total_multi).quantize(Decimal("0.0001"))

def calculate_xp(won: bool, win_streak: int) -> int:
    """Reward XP based on win/loss and current momentum."""
    if won:
        # Streak multiplier for XP to encourage retention
        streak_bonus = min(win_streak * 15, 150)
        return XP_WIN + streak_bonus
    return XP_LOSS

def is_near_miss_price(direction: str, entry_price: float, current_price: float) -> bool:
    """Tight 0.05% threshold for 'Near Miss' visual feedback on the inner ring."""
    diff_percent = abs(current_price - entry_price) / entry_price
    threshold = 0.0005 
    
    if direction == "UP" and current_price < entry_price:
        return diff_percent <= threshold
    elif direction == "DOWN" and current_price > entry_price:
        return diff_percent <= threshold
    return False

def get_streak_alert(streak: int) -> dict | None:
    """B2B Notification data for reaching Cash Volt milestones."""
    if streak in STREAK_BONUSES:
        multi = STREAK_BONUSES[streak]
        return {
            "title": f"STREAK {streak}x!",
            "message": f"Massive {multi}x Bonus Multiplier now ACTIVE!",
            "type": "BONUS_UNLOCK"
        }
    return None