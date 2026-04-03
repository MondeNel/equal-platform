import httpx
import random
from ..services.redis_client import cache_get, cache_set

# Exchange fee rates
EXCHANGE_FEES = {
    "Luno":          0.0010,
    "VALR":          0.0010,
    "AltCoinTrader": 0.0015,
    "Binance":       0.0010,
    "Kraken":        0.0016,
    "Coinbase":      0.0025,
}

EXCHANGES_LOCAL  = ["Luno", "VALR", "AltCoinTrader"]
EXCHANGES_GLOBAL = ["Binance", "Kraken", "Coinbase"]
ALL_EXCHANGES    = EXCHANGES_LOCAL + EXCHANGES_GLOBAL

SUPPORTED_SYMBOLS = ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"]

# Cache TTL in seconds
PRICE_CACHE_TTL = 10
USDZAR_CACHE_TTL = 60

# Platform fee percentage (10% of net profit)
PLATFORM_FEE_PERCENT = 0.10


async def fetch_base_prices() -> dict:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                "https://api.coingecko.com/api/v3/simple/price"
                "?ids=bitcoin,ethereum,solana,ripple&vs_currencies=usd"
            )
            data = res.json()
            return {
                "BTC/USD": data.get("bitcoin",  {}).get("usd", 67000),
                "ETH/USD": data.get("ethereum", {}).get("usd", 2100),
                "SOL/USD": data.get("solana",   {}).get("usd", 90),
                "XRP/USD": data.get("ripple",   {}).get("usd", 1.4),
            }
    except Exception:
        return {
            "BTC/USD": 67000,
            "ETH/USD": 2100,
            "SOL/USD": 90,
            "XRP/USD": 1.4,
        }


def simulate_exchange_prices(base_prices: dict) -> dict:
    prices = {}
    for exchange in ALL_EXCHANGES:
        prices[exchange] = {}
        for symbol, base in base_prices.items():
            if exchange in EXCHANGES_LOCAL:
                variation = random.uniform(0.002, 0.008)
            else:
                variation = random.uniform(-0.002, 0.003)
            prices[exchange][symbol] = round(base * (1 + variation), 2)
    return prices


async def get_exchange_prices() -> dict:
    cache_key = "arb_exchange_prices"
    cached = await cache_get(cache_key)
    if cached:
        return cached
    base = await fetch_base_prices()
    prices = simulate_exchange_prices(base)
    await cache_set(cache_key, prices, ttl=PRICE_CACHE_TTL)
    return prices


async def get_usd_to_zar() -> float:
    cache_key = "usd_zar_rate"
    cached = await cache_get(cache_key)
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get("https://api.frankfurter.app/latest?from=USD&to=ZAR")
            data = res.json()
            rate = float(data["rates"]["ZAR"])
            await cache_set(cache_key, rate, ttl=USDZAR_CACHE_TTL)
            return rate
    except Exception:
        return 18.0


def calculate_spread(symbol: str, buy_exchange: str, sell_exchange: str, prices: dict) -> dict:
    buy_price = prices.get(buy_exchange, {}).get(symbol, 0)
    sell_price = prices.get(sell_exchange, {}).get(symbol, 0)
    if not buy_price or not sell_price:
        return None
    spread = sell_price - buy_price
    spread_pct = (spread / buy_price) * 100
    return {
        "symbol": symbol,
        "buy_exchange": buy_exchange,
        "sell_exchange": sell_exchange,
        "buy_price": buy_price,
        "sell_price": sell_price,
        "spread": round(spread, 2),
        "spread_pct": round(spread_pct, 4),
    }


def calculate_profit_with_fee(spread_data: dict, amount_usd: float, usd_to_zar: float = 18.0) -> dict:
    buy_price = spread_data["buy_price"]
    sell_price = spread_data["sell_price"]
    buy_exchange = spread_data["buy_exchange"]
    sell_exchange = spread_data["sell_exchange"]

    coin_qty = amount_usd / buy_price

    # Exchange fees
    buy_fee_usd = amount_usd * EXCHANGE_FEES.get(buy_exchange, 0.001)
    sell_fee_usd = (coin_qty * sell_price) * EXCHANGE_FEES.get(sell_exchange, 0.001)
    total_fees_usd = buy_fee_usd + sell_fee_usd

    gross_profit_usd = (sell_price - buy_price) * coin_qty
    net_profit_usd = gross_profit_usd - total_fees_usd

    # Platform fee (10% of net profit)
    platform_fee_usd = net_profit_usd * PLATFORM_FEE_PERCENT
    net_profit_after_fee_usd = net_profit_usd - platform_fee_usd

    return {
        "coin_quantity": round(coin_qty, 8),
        "gross_profit_usd": round(gross_profit_usd, 2),
        "fees_usd": round(total_fees_usd, 2),
        "net_profit_usd": round(net_profit_usd, 2),
        "platform_fee_usd": round(platform_fee_usd, 2),
        "net_profit_after_fee_usd": round(net_profit_after_fee_usd, 2),
        "net_profit_after_fee_zar": round(net_profit_after_fee_usd * usd_to_zar, 2),
        "fees_zar": round(total_fees_usd * usd_to_zar, 2),
        "platform_fee_zar": round(platform_fee_usd * usd_to_zar, 2),
    }


async def find_best_opportunities(usd_to_zar: float = 18.0) -> list:
    prices = await get_exchange_prices()
    opportunities = []
    for symbol in SUPPORTED_SYMBOLS:
        for buy_ex in ALL_EXCHANGES:
            for sell_ex in ALL_EXCHANGES:
                if buy_ex == sell_ex:
                    continue
                spread_data = calculate_spread(symbol, buy_ex, sell_ex, prices)
                if not spread_data or spread_data["spread_pct"] < 0.1:
                    continue
                profit_data = calculate_profit_with_fee(spread_data, 1000, usd_to_zar)
                if profit_data["net_profit_after_fee_usd"] > 0:
                    opportunities.append({
                        **spread_data,
                        **profit_data,
                        "buy_price_zar": round(spread_data["buy_price"] * usd_to_zar, 2),
                        "sell_price_zar": round(spread_data["sell_price"] * usd_to_zar, 2),
                        "spread_zar": round(spread_data["spread"] * usd_to_zar, 2),
                    })
    opportunities.sort(key=lambda x: x["net_profit_after_fee_usd"], reverse=True)
    return opportunities[:10]
