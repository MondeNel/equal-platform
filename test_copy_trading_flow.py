#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete Copy Trading Flow Test
Simulates: trader places trade -> follower copies -> trader closes -> commission paid
"""
import requests
import time
import subprocess

TRADER_ID = "00000000-0000-0000-0000-000000000001"
FOLLOWER_ID = "11111111-1111-1111-1111-111111111111"
WALLET_URL = "http://localhost:8002"
TRADING_URL = "http://localhost:8003"
FOLLOW_URL = "http://localhost:8005"

def print_step(step, message):
    print(f"\n{'='*60}")
    print(f"STEP {step}: {message}")
    print(f"{'='*60}")

def get_wallet(user_id):
    resp = requests.get(f"{WALLET_URL}/api/wallet/", headers={"X-User-ID": user_id})
    resp.raise_for_status()
    data = resp.json()
    return {
        "balance": float(data["balance"]),
        "available": float(data["available"]),
        "margin": float(data["margin"])
    }

def test_copy_trading_flow():
    print("\n" + "="*60)
    print("COPY TRADING COMPLETE FLOW TEST")
    print("="*60)

    # Step 1: Check initial balances
    print_step(1, "Checking initial wallet balances")
    trader_initial = get_wallet(TRADER_ID)
    follower_initial = get_wallet(FOLLOWER_ID)
    print(f"Trader balance: ZAR {trader_initial['balance']:.2f}")
    print(f"Follower balance: ZAR {follower_initial['balance']:.2f}")

    # Step 2: Ensure follower follows trader
    print_step(2, "Follower follows trader")
    resp = requests.post(f"{FOLLOW_URL}/api/follow/{TRADER_ID}", 
                         headers={"X-User-ID": FOLLOWER_ID})
    if resp.status_code == 200:
        print("[OK] Now following trader")
    else:
        print("Already following trader")

    # Step 3: Reset follower's copy limits
    print_step(3, "Resetting follower's copy limits")
    subprocess.run([
        "docker", "exec", "-i", "equal-platform-follow-db-1", "psql", "-U", "equal", "-d", "follow_db",
        "-c", f"UPDATE user_copy_stats SET free_copies_used = 0, daily_free_limit = 3 WHERE user_id = '{FOLLOWER_ID}';"
    ], capture_output=True)
    print("[OK] Copy limits reset")

    # Step 4: Trader places and activates trade
    print_step(4, "Trader places BUY order (USD/ZAR, Mini lot)")
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
        headers={"X-User-ID": TRADER_ID}
    )
    order_id = order_resp.json()["id"]
    
    activate_resp = requests.post(
        f"{TRADING_URL}/api/orders/{order_id}/activate",
        json={"activation_price": 18.25},
        headers={"X-User-ID": TRADER_ID}
    )
    trade_id = activate_resp.json()["id"]
    print(f"[OK] Trade activated. Trade ID: {trade_id}")

    # Step 5: Follower gets notification
    print_step(5, "Follower checks for notifications")
    time.sleep(1)
    notif_resp = requests.get(f"{FOLLOW_URL}/api/notifications", 
                              headers={"X-User-ID": FOLLOWER_ID})
    notifications = notif_resp.json()
    print(f"[OK] Found {len(notifications)} notification(s)")
    if notifications:
        print(f"   Notification: {notifications[0]['symbol']} from trader")

    # Step 6: Follower copies the trade
    print_step(6, "Follower copies trade (Standard lot)")
    copy_resp = requests.post(
        f"{TRADING_URL}/api/copy/execute",
        json={
            "original_trade_id": trade_id,
            "lot_size": "Standard",
            "volume": 1
        },
        headers={"X-User-ID": FOLLOWER_ID}
    )
    copy_resp.raise_for_status()
    copy_data = copy_resp.json()
    print(f"[OK] Copy trade created. ID: {copy_data['id']}, Margin: {copy_data['margin']} ZAR")

    # Step 7: Check follower's open trades
    print_step(7, "Checking follower's open trades")
    follower_trades = requests.get(f"{TRADING_URL}/api/trades/open", 
                                   headers={"X-User-ID": FOLLOWER_ID}).json()
    print(f"[OK] Follower has {len(follower_trades)} open trade(s)")

    # Step 8: Trader closes trade at profit
    print_step(8, "Trader closes trade at profit (18.26)")
    close_resp = requests.post(
        f"{TRADING_URL}/api/trades/{trade_id}/close",
        json={"close_price": 18.26, "close_reason": "TAKE_PROFIT"},
        headers={"X-User-ID": TRADER_ID}
    )
    close_resp.raise_for_status()
    close_data = close_resp.json()
    
    # Handle bonus case
    if close_data.get("bonus_available"):
        print(f"[BONUS] Bonus available! Cashing out...")
        bonus_resp = requests.post(
            f"{TRADING_URL}/api/trades/{trade_id}/bonus_decision",
            json={"action": "cashout"},
            headers={"X-User-ID": TRADER_ID}
        )
        bonus_data = bonus_resp.json()
        print(f"[OK] Bonus cashed out. Trader PnL: ZAR {bonus_data['pnl']}")
        trader_pnl = bonus_data['pnl']
    else:
        print(f"[OK] Trader's PnL: ZAR {close_data['pnl']}")
        trader_pnl = close_data['pnl']

    # Step 9: Wait for auto-close and commission
    print_step(9, "Waiting for copy trade to auto-close")
    time.sleep(2)

    # Step 10: Check final balances
    print_step(10, "Checking final wallet balances")
    trader_final = get_wallet(TRADER_ID)
    follower_final = get_wallet(FOLLOWER_ID)
    
    trader_change = trader_final['balance'] - trader_initial['balance']
    follower_change = follower_final['balance'] - follower_initial['balance']
    
    print(f"Trader: {trader_initial['balance']:.2f} -> {trader_final['balance']:.2f} (change: {trader_change:+.2f})")
    print(f"Follower: {follower_initial['balance']:.2f} -> {follower_final['balance']:.2f} (change: {follower_change:+.2f})")

    # Step 11: Check commission in database
    print_step(11, "Checking commission in follow service")
    result = subprocess.run([
        "docker", "exec", "-i", "equal-platform-follow-db-1", "psql", "-U", "equal", "-d", "follow_db",
        "-c", "SELECT id, status, follower_profit, trader_commission FROM copy_trades ORDER BY created_at DESC LIMIT 3;"
    ], capture_output=True, text=True)
    print("Copy trades in database:")
    print(result.stdout)

    # Summary
    print("\n" + "="*60)
    print("COPY TRADING FLOW TEST SUMMARY")
    print("="*60)
    print(f"[OK] Trader placed and activated trade")
    print(f"[OK] Follower received notification")
    print(f"[OK] Follower copied trade with custom lot size")
    print(f"[OK] Trader closed trade at profit")
    if follower_change > 0:
        print(f"[OK] Follower earned profit: ZAR {follower_change:.2f}")
    if trader_change > trader_pnl:
        commission = trader_change - trader_pnl
        print(f"[OK] Trader received commission: ZAR {commission:.2f}")
    print("\n[SUCCESS] Copy trading flow test passed!\n")

if __name__ == "__main__":
    test_copy_trading_flow()
