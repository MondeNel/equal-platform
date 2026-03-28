from fastapi import APIRouter
import random
import asyncio
import urllib.parse

router = APIRouter(prefix="/api/prices", tags=["prices"])

_prices = {}

DEFAULT_PRICES = {
    "USD/ZAR": 18.25,
    "EUR/USD": 1.085,
    "GBP/USD": 1.265,
    "USD/JPY": 149.5,
    "BTC/USD": 67000,
    "ETH/USD": 3800,
    "SOL/USD": 180,
    "XRP/USD": 0.62,
    "APPLE": 185.5,
    "TESLA": 248.9,
    "NVIDIA": 875.6,
    "AMAZON": 182.3,
}

VOLATILITY = {
    "Crypto": 0.002,
    "Forex": 0.0005,
    "Stocks": 0.001,
}

def get_asset_class(symbol: str) -> str:
    if symbol in ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"]:
        return "Crypto"
    if symbol in ["USD/ZAR", "EUR/USD", "GBP/USD", "USD/JPY"]:
        return "Forex"
    return "Stocks"

def simulate_price(symbol: str) -> float:
    current = _prices.get(symbol, DEFAULT_PRICES.get(symbol, 100.0))
    asset_class = get_asset_class(symbol)
    vol = VOLATILITY.get(asset_class, 0.001)
    change = random.uniform(-vol, vol)
    new_price = current * (1 + change)
    new_price = max(new_price, 0.01)
    
    if asset_class == "Crypto":
        return round(new_price, 2)
    elif asset_class == "Forex":
        return round(new_price, 5)
    else:
        return round(new_price, 2)

async def price_updater():
    while True:
        for symbol in DEFAULT_PRICES.keys():
            _prices[symbol] = simulate_price(symbol)
        await asyncio.sleep(2)

@router.get("/{symbol:path}")
async def get_price(symbol: str):
    # Decode URL encoded symbols
    symbol = urllib.parse.unquote(symbol)
    price = _prices.get(symbol, DEFAULT_PRICES.get(symbol, 0))
    return {"symbol": symbol, "price": price}
