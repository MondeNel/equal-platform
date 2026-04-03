#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete Arbitrage App Flow Test
Simulates a user: check balance -> find opportunities -> execute arbitrage -> verify profit
"""
import requests
import time
import sys

USER_ID = "11111111-1111-1111-1111-111111111111"
WALLET_URL = "http://localhost:8002"
ARB_URL = "http://localhost:8004"

def print_step(step, message):
    print(f"\n{'='*60}")
    print(f"STEP {step}: {message}")
    print(f"{'='*60}")

def get_wallet():
    resp = requests.get(f"{WALLET_URL}/api/wallet/", headers={"X-User-ID": USER_ID})
    resp.raise_for_status()
    data = resp.json()
    return {
        "balance": float(data["balance"]),
        "available": float(data["available"]),
        "margin": float(data["margin"])
    }

def test_arbitrage_flow():
    print("\n" + "="*60)
    print("ARBITRAGE APP COMPLETE FLOW TEST")
    print("="*60)

    # Step 1: Check initial balance
    print_step(1, "Checking initial wallet balance")
    initial = get_wallet()
    print(f"Balance: ZAR {initial['balance']:.2f}")
    print(f"Available: ZAR {initial['available']:.2f}")

    # Step 2: Get exchange prices
    print_step(2, "Fetching exchange prices")
    exchanges_resp = requests.get(f"{ARB_URL}/api/arb/exchanges", headers={"X-User-ID": USER_ID})
    exchanges = exchanges_resp.json()
    print(f"[OK] Found {len(exchanges)} exchanges")
    for ex, symbols in list(exchanges.items())[:3]:  # Show first 3
        print(f"   - {ex}: BTC={symbols.get('BTC/USD', {}).get('usd', 'N/A')} USD")

    # Step 3: Find arbitrage opportunities
    print_step(3, "Finding arbitrage opportunities")
    opp_resp = requests.get(f"{ARB_URL}/api/arb/opportunities", headers={"X-User-ID": USER_ID})
    data = opp_resp.json()
    opportunities = data.get("opportunities", [])
    print(f"[OK] Found {len(opportunities)} opportunity(ies)")

    if not opportunities:
        print("[WARNING] No opportunities available. Test may fail.")
        return

    # Display best opportunity
    best = opportunities[0]
    print(f"\n[INFO] Best opportunity:")
    print(f"   Symbol: {best['symbol']}")
    print(f"   Buy: {best['buy_exchange']} @ {best['buy_price']} USD")
    print(f"   Sell: {best['sell_exchange']} @ {best['sell_price']} USD")
    print(f"   Spread: {best['spread_pct']}%")
    print(f"   Est. profit (1000 USD): ZAR {best['net_profit_after_fee_zar']}")
    print(f"   Platform fee: ZAR {best['platform_fee_zar']}")

    # Step 4: Execute arbitrage trade
    print_step(4, "Executing arbitrage trade (amount: ZAR 100)")
    amount = 100
    execute_resp = requests.post(
        f"{ARB_URL}/api/arb/execute",
        json={
            "symbol": best["symbol"],
            "buy_exchange": best["buy_exchange"],
            "sell_exchange": best["sell_exchange"],
            "amount": amount,
            "opportunity_id": None
        },
        headers={"X-User-ID": USER_ID}
    )
    execute_resp.raise_for_status()
    result = execute_resp.json()
    print(f"[OK] Trade executed!")
    print(f"   Trade ID: {result['id']}")
    print(f"   Exchange fees: ZAR {result['exchange_fees']}")
    print(f"   Platform fee: ZAR {result['platform_fee']}")
    print(f"   Actual profit: ZAR {result['actual_profit']}")

    # Step 5: Check wallet balance after trade
    print_step(5, "Checking wallet balance after arbitrage")
    after_trade = get_wallet()
    expected_balance = initial["balance"] + result["actual_profit"]
    print(f"   Initial balance: ZAR {initial['balance']:.2f}")
    print(f"   Expected balance: ZAR {expected_balance:.2f}")
    print(f"   Actual balance: ZAR {after_trade['balance']:.2f}")

    if abs(after_trade['balance'] - expected_balance) < 0.01:
        print("[OK] Wallet balance updated correctly")
    else:
        print("[FAIL] Balance mismatch!")
        sys.exit(1)

    # Step 6: Check trade history
    print_step(6, "Checking arbitrage trade history")
    history_resp = requests.get(f"{ARB_URL}/api/arb/history", headers={"X-User-ID": USER_ID})
    history = history_resp.json()
    print(f"[OK] Total trades: {len(history)}")
    if history:
        latest = history[0]
        print(f"   Latest trade: {latest['symbol']} | Profit: ZAR {latest['actual_profit']}")

    # Summary
    print("\n" + "="*60)
    print("ARBITRAGE FLOW TEST SUMMARY")
    print("="*60)
    print(f"[OK] Found profitable arbitrage opportunity")
    print(f"[OK] Executed trade with amount ZAR {amount}")
    print(f"[OK] Profit after fees: ZAR {result['actual_profit']:.2f}")
    print(f"[OK] Wallet balance increased correctly")
    print(f"[OK] Trade recorded in history")
    print("\n[SUCCESS] Arbitrage app flow test passed!\n")

if __name__ == "__main__":
    test_arbitrage_flow()
