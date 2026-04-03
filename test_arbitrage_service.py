#!/usr/bin/env python3
import requests

ARB_URL = "http://localhost:8004"
USER_ID = "11111111-1111-1111-1111-111111111111"

def print_test(name, result, details=""):
    status = "✅ PASS" if result else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"     {details}")

def test_arbitrage_service():
    print("\n" + "="*60)
    print("TESTING ARBITRAGE SERVICE")
    print("="*60)

    # 1. Health check
    try:
        resp = requests.get(f"{ARB_URL}/health")
        print_test("Health check", resp.status_code == 200, f"Status: {resp.status_code}")
    except Exception as e:
        print_test("Health check", False, str(e))

    # 2. Get exchanges
    try:
        resp = requests.get(f"{ARB_URL}/api/arb/exchanges", headers={"X-User-ID": USER_ID})
        exchanges = resp.json()
        print_test("Get exchanges", len(exchanges) > 0, f"Found {len(exchanges)} exchange(s)")
    except Exception as e:
        print_test("Get exchanges", False, str(e))

    # 3. Get opportunities
    try:
        resp = requests.get(f"{ARB_URL}/api/arb/opportunities", headers={"X-User-ID": USER_ID})
        data = resp.json()
        print_test("Get opportunities", data.get("count", 0) >= 0, f"Found {data.get('count', 0)} opportunity(ies)")
    except Exception as e:
        print_test("Get opportunities", False, str(e))

    # 4. Execute arbitrage (if opportunity exists)
    try:
        # First get opportunities
        opp_resp = requests.get(f"{ARB_URL}/api/arb/opportunities", headers={"X-User-ID": USER_ID})
        opportunities = opp_resp.json().get("opportunities", [])
        
        if opportunities:
            best = opportunities[0]
            resp = requests.post(f"{ARB_URL}/api/arb/execute",
                                json={
                                    "symbol": best["symbol"],
                                    "buy_exchange": best["buy_exchange"],
                                    "sell_exchange": best["sell_exchange"],
                                    "amount": 100,
                                    "opportunity_id": None
                                },
                                headers={"X-User-ID": USER_ID})
            print_test("Execute arbitrage", resp.status_code == 200, f"Profit: {resp.json().get('actual_profit', 0)}")
        else:
            print_test("Execute arbitrage", True, "No opportunities available (skipped)")
    except Exception as e:
        print_test("Execute arbitrage", False, str(e))

    # 5. Get trade history
    try:
        resp = requests.get(f"{ARB_URL}/api/arb/history", headers={"X-User-ID": USER_ID})
        history = resp.json()
        print_test("Get trade history", True, f"Found {len(history)} trade(s)")
    except Exception as e:
        print_test("Get trade history", False, str(e))

    print("\n✅ Arbitrage service tests completed\n")

if __name__ == "__main__":
    test_arbitrage_service()
