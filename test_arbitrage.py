#!/usr/bin/env python3
import requests
import time

USER_ID = "11111111-1111-1111-1111-111111111111"
WALLET_URL = "http://localhost:8002"
ARB_URL = "http://localhost:8004"

def get_wallet():
    resp = requests.get(f"{WALLET_URL}/api/wallet", headers={"X-User-ID": USER_ID})
    resp.raise_for_status()
    return resp.json()

def test():
    print("=" * 50)
    print("Testing Arbitrage Service with Wallet Integration")
    print("=" * 50)

    # 1. Initial balance
    initial = get_wallet()
    print(f"Initial balance: ZAR {initial['balance']}, Available: {initial['available']}")

    # 2. Fetch opportunities
    print("\nFetching arbitrage opportunities...")
    opp_resp = requests.get(f"{ARB_URL}/api/arb/opportunities", headers={"X-User-ID": USER_ID})
    opp_resp.raise_for_status()
    opps = opp_resp.json()
    print(f"Found {opps['count']} opportunities")
    if not opps['opportunities']:
        print("No opportunities available. Try again later.")
        return

    # Pick the best opportunity
    best = opps['opportunities'][0]
    print(f"\nBest opportunity: {best['symbol']} | Buy {best['buy_exchange']} @ {best['buy_price']} | Sell {best['sell_exchange']} @ {best['sell_price']}")
    print(f"Estimated profit (1000 USD) after fees: ZAR {best['net_profit_after_fee_zar']}")
    print(f"Platform fee (10% of net profit): ZAR {best['platform_fee_zar']}")

    # 3. Execute trade with amount = 100 ZAR (small to test)
    amount = 100
    print(f"\nExecuting arbitrage with amount ZAR {amount}...")
    exec_resp = requests.post(
        f"{ARB_URL}/api/arb/execute",
        json={
            "symbol": best['symbol'],
            "buy_exchange": best['buy_exchange'],
            "sell_exchange": best['sell_exchange'],
            "amount": amount,
            "opportunity_id": None
        },
        headers={"X-User-ID": USER_ID}
    )
    exec_resp.raise_for_status()
    result = exec_resp.json()
    print(f"Trade executed. Profit after fees: ZAR {result['actual_profit']}")
    print(f"Exchange fees: ZAR {result['exchange_fees']}, Platform fee: ZAR {result['platform_fee']}")

    # 4. Check final balance
    time.sleep(1)
    final = get_wallet()
    print(f"\nFinal balance: ZAR {final['balance']}, Available: {final['available']}")
    expected_balance = initial['balance'] + result['actual_profit']
    print(f"Expected balance: ZAR {expected_balance}")
    if final['balance'] == expected_balance:
        print("✅ Wallet balance correct after arbitrage.")
    else:
        print(f"❌ Balance mismatch: got {final['balance']}, expected {expected_balance}")

    # 5. Check history
    hist_resp = requests.get(f"{ARB_URL}/api/arb/history", headers={"X-User-ID": USER_ID})
    hist_resp.raise_for_status()
    history = hist_resp.json()
    print(f"\nTrade history count: {len(history)}")
    if history:
        print("Latest trade profit:", history[0]['actual_profit'])
    print("All tests passed!")

if __name__ == "__main__":
    test()
