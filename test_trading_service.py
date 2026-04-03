#!/usr/bin/env python3
import requests
import time

TRADING_URL = "http://localhost:8003"
USER_ID = "11111111-1111-1111-1111-111111111111"

def print_test(name, result, details=""):
    status = "✅ PASS" if result else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"     {details}")

def test_trading_service():
    print("\n" + "="*60)
    print("TESTING TRADING SERVICE")
    print("="*60)

    # 1. Health check
    try:
        resp = requests.get(f"{TRADING_URL}/health")
        print_test("Health check", resp.status_code == 200, f"Status: {resp.status_code}")
    except Exception as e:
        print_test("Health check", False, str(e))

    # 2. Place pending order
    try:
        resp = requests.post(f"{TRADING_URL}/api/orders/place",
                            json={
                                "symbol": "USD/ZAR",
                                "direction": "BUY",
                                "lot_size": "Mini",
                                "volume": 1,
                                "entry_price": 18.25,
                                "take_profit": None,
                                "stop_loss": None
                            },
                            headers={"X-User-ID": USER_ID})
        order_id = resp.json()["id"]
        print_test("Place pending order", resp.status_code == 200, f"Order ID: {order_id}")
    except Exception as e:
        print_test("Place pending order", False, str(e))

    # 3. Get pending orders
    try:
        resp = requests.get(f"{TRADING_URL}/api/orders/pending", headers={"X-User-ID": USER_ID})
        orders = resp.json()
        print_test("Get pending orders", len(orders) > 0, f"Found {len(orders)} pending order(s)")
    except Exception as e:
        print_test("Get pending orders", False, str(e))

    # 4. Activate order
    try:
        resp = requests.post(f"{TRADING_URL}/api/orders/{order_id}/activate",
                            json={"activation_price": 18.25},
                            headers={"X-User-ID": USER_ID})
        trade_id = resp.json()["id"]
        print_test("Activate order", resp.status_code == 200, f"Trade ID: {trade_id}")
    except Exception as e:
        print_test("Activate order", False, str(e))

    # 5. Get open trades
    try:
        resp = requests.get(f"{TRADING_URL}/api/trades/open", headers={"X-User-ID": USER_ID})
        trades = resp.json()
        print_test("Get open trades", len(trades) > 0, f"Found {len(trades)} open trade(s)")
    except Exception as e:
        print_test("Get open trades", False, str(e))

    # 6. Get player stats
    try:
        resp = requests.get(f"{TRADING_URL}/api/stats/", headers={"X-User-ID": USER_ID})
        stats = resp.json()
        print_test("Get player stats", "win_streak" in stats, f"Win streak: {stats.get('win_streak', 0)}")
    except Exception as e:
        print_test("Get player stats", False, str(e))

    # 7. Close trade
    try:
        resp = requests.post(f"{TRADING_URL}/api/trades/{trade_id}/close",
                            json={"close_price": 18.26, "close_reason": "TEST"},
                            headers={"X-User-ID": USER_ID})
        print_test("Close trade", resp.status_code == 200, f"PnL: {resp.json().get('pnl', 0)}")
    except Exception as e:
        print_test("Close trade", False, str(e))

    # 8. Get trade history
    try:
        resp = requests.get(f"{TRADING_URL}/api/trades/history", headers={"X-User-ID": USER_ID})
        history = resp.json()
        print_test("Get trade history", len(history) > 0, f"Found {len(history)} trade(s)")
    except Exception as e:
        print_test("Get trade history", False, str(e))

    print("\n✅ Trading service tests completed\n")

if __name__ == "__main__":
    test_trading_service()
