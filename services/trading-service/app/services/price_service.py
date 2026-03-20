import httpx
import asyncio
import json
import os
from datetime import datetime

# In-memory price cache
_prices = {}
_last_updated = {}

SYMBOL_MAP = {
    "BTC/USD": "bitcoin",
    "ETH/USD": "ethereum",
    "SOL/USD": "solana",
    "XRP/USD": "ripple",
}

FOREX_PAIRS = {
    "USD/ZAR": ("USD", "ZAR"),
    "EUR/USD": ("EUR", "USD"),
    "GBP/USD": ("GBP", "USD"),
    "USD/JPY": ("USD", "JPY"),
}

STOCK_PRICES = {
    "APPLE":  185.50,
    "TESLA":  248.90,
    "NVIDIA": 875.60,
    "AMAZON": 182.30,
}


async def fetch_crypto_prices():
    try:
        ids = ",".join(SYMBOL_MAP.values())
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url)
            data = res.json()
            for symbol, coin_id in SYMBOL_MAP.items():
                if coin_id in data:
                    _prices[symbol] = float(data[coin_id]["usd"])
                    _last_updated[symbol] = datetime.utcnow()
    except Exception as e:
        print(f"Crypto fetch error: {e}")


async def fetch_forex_prices():
    try:
        url = "https://api.frankfurter.app/latest?from=USD"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url)
            data = res.json()
            rates = data.get("rates", {})

            # USD/ZAR
            if "ZAR" in rates:
                _prices["USD/ZAR"] = float(rates["ZAR"])
                _last_updated["USD/ZAR"] = datetime.utcnow()

            # EUR/USD
            if "EUR" in rates:
                _prices["EUR/USD"] = round(1 / float(rates["EUR"]), 5)
                _last_updated["EUR/USD"] = datetime.utcnow()

            # GBP/USD
            if "GBP" in rates:
                _prices["GBP/USD"] = round(1 / float(rates["GBP"]), 5)
                _last_updated["GBP/USD"] = datetime.utcnow()

            # USD/JPY
            if "JPY" in rates:
                _prices["USD/JPY"] = float(rates["JPY"])
                _last_updated["USD/JPY"] = datetime.utcnow()

    except Exception as e:
        print(f"Forex fetch error: {e}")


def get_price(symbol: str) -> float:
    # Stocks use static prices with small drift
    if symbol in STOCK_PRICES:
        import random
        base = STOCK_PRICES[symbol]
        drift = base * random.uniform(-0.001, 0.001)
        return round(base + drift, 2)

    return _prices.get(symbol, 0.0)


async def realtime_price_updater():
    """Background task — fetches prices every 15 seconds"""
    while True:
        await asyncio.gather(
            fetch_crypto_prices(),
            fetch_forex_prices(),
        )
        await asyncio.sleep(15)