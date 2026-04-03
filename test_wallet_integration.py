#!/usr/bin/env python3
import requests
import json
import sys

USER_ID = "11111111-1111-1111-1111-111111111111"
WALLET_URL = "http://localhost:8002"
TRADING_URL = "http://localhost:8003"
ORBIT_URL = "http://localhost:8006"

def get_wallet():
    resp = requests.get(f"{WALLET_URL}/api/wallet", headers={"X-User-ID": USER_ID})
    resp.raise_for_status()
    return resp.json()  # returns {balance, available, margin, ...}

def test():
    print("=" * 50)
    print("Testing Wallet Integration (OrbitBet + Trading)")
    print("=" * 50)

    # 1. Initial wallet state
    print("1. Fetching initial wallet...")
    initial = get_wallet()
    print(f"   Balance: ZAR {initial['balance']}, Available: ZAR {initial['available']}, Margin: ZAR {initial['margin']}")

    # 2. Place OrbitBet bet
    print("2. Placing OrbitBet bet (stake=50, UP)...")
    place_resp = requests.post(
        f"{ORBIT_URL}/api/bet/place",
        json={"symbol": "BTC/USD", "direction": "UP", "stake": 50},
        headers={"X-User-ID": USER_ID}
    )
    place_resp.raise_for_status()
    bet_id = place_resp.json()["bet_id"]
    print(f"   Bet ID: {bet_id}")

    # Check wallet after reservation (available should decrease by 50, balance unchanged)
    after_place = get_wallet()
    print(f"   Balance: ZAR {after_place['balance']}, Available: ZAR {after_place['available']}, Margin: ZAR {after_place['margin']}")
    assert after_place['balance'] == initial['balance'], "Balance should not change on reservation"
    assert after_place['available'] == initial['available'] - 50, "Available should decrease by stake"
    assert after_place['margin'] == initial['margin'] + 50, "Margin should increase by stake"
    print("   ✅ Wallet reservation correct")

    # 3. Resolve all three rounds (always choose UP)
    final_result = None
    payout = None
    for round_num in range(1, 4):
        print(f"3.{round_num} Resolving round {round_num} (choose UP)...")
        round_resp = requests.post(
            f"{ORBIT_URL}/api/bet/round",
            json={"bet_id": bet_id, "chosen_direction": "UP"},
            headers={"X-User-ID": USER_ID}
        )
        round_resp.raise_for_status()
        data = round_resp.json()
        if round_num == 3:
            final_result = data["final_result"]
            payout = data.get("payout")
        print(f"      Round {round_num} result: {data['result']}")

    print(f"   Final result: {final_result}, Payout: ZAR {payout if payout else 'N/A'}")

    # 4. Check wallet after OrbitBet completion
    after_orbit = get_wallet()
    if final_result == "WIN":
        expected_balance = initial['balance'] - 50 + payout
    else:
        expected_balance = initial['balance'] - 50
    print(f"   Balance: ZAR {after_orbit['balance']}, Available: ZAR {after_orbit['available']}, Margin: ZAR {after_orbit['margin']}")
    assert after_orbit['balance'] == expected_balance, "Balance mismatch after OrbitBet"
    assert after_orbit['margin'] == 0, "Margin should be zero after completion"
    print("   ✅ Wallet balance correct after OrbitBet")

    # 5. Trading trade (place, activate, close at profit)
    print("5. Testing trading trade (BUY USD/ZAR, close at profit)...")
    # Place order
    order_resp = requests.post(
        f"{TRADING_URL}/api/orders/place",
        json={
            "symbol": "USD/ZAR",
            "direction": "BUY",
            "lot_size": "Mini",
            "volume": 1,
            "entry_price": 18.25,
            "take_profit": None,
            "stop_loss": None
        },
        headers={"X-User-ID": USER_ID}
    )
    order_resp.raise_for_status()
    order_id = order_resp.json()["id"]
    print(f"   Order ID: {order_id}")

    # Activate
    requests.post(
        f"{TRADING_URL}/api/orders/{order_id}/activate",
        json={"activation_price": 18.25},
        headers={"X-User-ID": USER_ID}
    )

    # Get open trade ID
    trades_resp = requests.get(f"{TRADING_URL}/api/trades/open", headers={"X-User-ID": USER_ID})
    trades_resp.raise_for_status()
    trades = trades_resp.json()
    if not trades:
        print("   ❌ No open trade found")
        sys.exit(1)
    trade_id = trades[0]["id"]
    print(f"   Trade ID: {trade_id}")

    # Close at profit
    close_resp = requests.post(
        f"{TRADING_URL}/api/trades/{trade_id}/close",
        json={"close_price": 18.26, "close_reason": "TAKE_PROFIT"},
        headers={"X-User-ID": USER_ID}
    )
    close_resp.raise_for_status()
    pnl = close_resp.json()["pnl"]
    print(f"   Trade PnL: ZAR {pnl}")

    # Final wallet
    final = get_wallet()
    expected_final_balance = after_orbit['balance'] + pnl
    print(f"   Final balance: ZAR {final['balance']} (expected {expected_final_balance})")
    assert final['balance'] == expected_final_balance, "Balance mismatch after trade"
    assert final['margin'] == 0, "Margin should be zero"
    print("   ✅ Wallet balance correct after trading trade")

    print("=" * 50)
    print("All tests passed! Wallet integration works across OrbitBet and Trading apps.")
    print("=" * 50)

if __name__ == "__main__":
    test()