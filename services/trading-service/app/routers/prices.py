from fastapi import APIRouter
from app.services.price_service import get_price

router = APIRouter(prefix="/api/prices", tags=["prices"])

SYMBOLS = {
    "Crypto": ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"],
    "Forex":  ["USD/ZAR", "EUR/USD", "GBP/USD", "USD/JPY"],
    "Stocks": ["APPLE", "TESLA", "NVIDIA", "AMAZON"],
}

@router.get("/{symbol:path}")
async def get_symbol_price(symbol: str):
    price = get_price(symbol)
    return {
        "symbol": symbol,
        "price":  price,
    }

@router.get("")
async def get_all_prices():
    result = {}
    for market, symbols in SYMBOLS.items():
        result[market] = {s: get_price(s) for s in symbols}
    return result