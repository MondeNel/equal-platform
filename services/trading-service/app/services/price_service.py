import asyncio
import random
from datetime import datetime

_prices = {}
_last_updated = {}

ALL_SYMBOLS = [
    "USD/ZAR", "EUR/USD", "GBP/USD", "USD/JPY",
    "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD",
    "APPLE", "TESLA", "NVIDIA", "AMAZON"
]

DEFAULT_PRICES = {
    "USD/ZAR": 18.25, "EUR/USD": 1.085, "GBP/USD": 1.265, "USD/JPY": 149.5,
    "BTC/USD": 67000, "ETH/USD": 3800, "SOL/USD": 180, "XRP/USD": 0.62,
    "APPLE": 185.5, "TESLA": 248.9, "NVIDIA": 875.6, "AMAZON": 182.3,
}

VOLATILITY = {
    "Crypto": 0.002, "Forex": 0.0005, "Stocks": 0.001,
}

def get_asset_class(symbol):
    if symbol in ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"]:
        return "Crypto"
    if symbol in ["USD/ZAR", "EUR/USD", "GBP/USD", "USD/JPY"]:
        return "Forex"
    return "Stocks"

def simulate_price(symbol):
    current = _prices.get(symbol, DEFAULT_PRICES.get(symbol, 100.0))
    asset = get_asset_class(symbol)
    vol = VOLATILITY.get(asset, 0.001)
    change = random.uniform(-vol, vol)
    new_price = current * (1 + change)
    new_price = max(new_price, 0.01)
    if asset == "Crypto":
        return round(new_price, 2)
    elif asset == "Forex":
        return round(new_price, 5)
    else:
        return round(new_price, 2)

async def update_simulated_prices():
    for sym in ALL_SYMBOLS:
        _prices[sym] = simulate_price(sym)
        _last_updated[sym] = datetime.utcnow()

def get_price(symbol):
    return _prices.get(symbol, DEFAULT_PRICES.get(symbol, 0.0))

async def fast_simulation_ticker():
    while True:
        await update_simulated_prices()
        await asyncio.sleep(2)