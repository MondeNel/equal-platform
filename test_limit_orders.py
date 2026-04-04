#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Limit Orders for Arbitrage
"""
import requests
import time
import json

USER_ID = "11111111-1111-1111-1111-111111111111"
ARB_URL = "http://localhost:8004"

def print_test(name, result, details=""):
    status = "✅ PASS" if result else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"     {details}")

def test_limit_orders():
    print("\n" + "="*60)
    print("TESTING LIMIT ORDERS")
    print("="*60)

    # 1. Get current opportunities to find a good target spread
    print("1. Fetching current opportunities...")
    resp = requests.get(f"{ARB_URL}/api/arb/opportunities", headers={"X-User-ID": USER_ID})
    opportunities = resp.json().get("opportunities", [])
    
    if not opportunities:
        print("No opportunities found. Skipping limit order test.")
        return
    
    best = opportunities[0]
    current_spread = best["spread_pct"]
    # Set target spread slightly higher than current (e.g., current + 0.2%)
    target_spread = round(current_spread + 0.2, 2)
    
    print(f"   Current spread: {current_spread}%")
    print(f"   Target spread: {target_spread}%")
    print(f"   Symbol: {best['symbol']}")
    print(f"   Buy: {best['buy_exchange']} @ {best['buy_price']}")
    print(f"   Sell: {best['sell_exchange']} @ {best['sell_price']}")
    
    # 2. Create limit order (should be pending since target > current)
    print("\n2. Creating limit order...")
    limit_resp = requests.post(
        f"{ARB_URL}/api/arb/limit/create",
        json={
            "symbol": best["symbol"],
            "buy_exchange": best["buy_exchange"],
            "sell_exchange": best["sell_exchange"],
            "amount": 100,
            "target_spread_pct": target_spread,
            "expires_in_minutes": 5
        },
        headers={"X-User-ID": USER_ID}
    )
    
    if limit_resp.status_code == 200:
        order = limit_resp.json()
        print(f"   Order ID: {order['id']}")
        print(f"   Status: {order['status']}")
        print(f"   Target spread: {order['target_spread_pct']}%")
        print(f"   Expires at: {order['expires_at']}")
        print_test("Create limit order", True, f"Order created with status {order['status']}")
    else:
        print(f"   Error: {limit_resp.json()}")
        print_test("Create limit order", False, limit_resp.text)
        return
    
    # 3. Get pending orders
    print("\n3. Getting pending limit orders...")
    pending_resp = requests.get(f"{ARB_URL}/api/arb/limit/pending", headers={"X-User-ID": USER_ID})
    pending = pending_resp.json()
    print(f"   Found {len(pending)} pending order(s)")
    print_test("Get pending orders", len(pending) > 0, f"Pending orders: {len(pending)}")
    
    # 4. Cancel the limit order
    print("\n4. Cancelling limit order...")
    cancel_resp = requests.post(
        f"{ARB_URL}/api/arb/limit/cancel/{order['id']}",
        headers={"X-User-ID": USER_ID}
    )
    if cancel_resp.status_code == 200:
        print(f"   Cancelled: {cancel_resp.json()['message']}")
        print_test("Cancel limit order", True)
    else:
        print(f"   Error: {cancel_resp.json()}")
        print_test("Cancel limit order", False)
    
    print("\n✅ Limit order tests completed\n")

if __name__ == "__main__":
    test_limit_orders()
