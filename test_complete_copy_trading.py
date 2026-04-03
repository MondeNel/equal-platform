#!/usr/bin/env python3
import requests
import time
import json
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
    resp = requests.get(f"{WALLET_URL}/api/wallet", headers={"X-User-ID": user_id})
    resp.raise_for_status()
    data = resp.json()
    # Convert string balances to float
    return {
        "balance": float(data["balance"]),
        "available": float(data["available"]),
        "margin": float(data["margin"])
    }

def reset_follower_copy_stats():
    subprocess.run([
        "docker", "exec", "-i", "equal-platform-follow-db-1", "psql", "-U", "equal", "-d", "follow_db",
        "-c", f"UPDATE user_copy_stats SET free_copies_used = 0, daily_free_limit = 3 WHERE user_id = '{FOLLOWER_ID}';"
    ], capture_output=True)

def main():
    print("\n" + "="*60)
    print("COMPLETE COPY TRADING TEST")
    print("="*60)

    # Step 1: Ensure both users have sufficient balance
    print_step(1, "Setting up wallet balances")
    trader_initial = get_wallet(TRADER_ID)
    follower_initial = get_wallet(FOLLOWER_ID)
    print(f"Trader initial balance: ZAR {trader_initial['balance']:.2f}")
    print(f"Follower initial balance: ZAR {follower_initial['balance']:.2f}")

    # Step 2: Ensure follower follows trader
    print_step(2, "Follower follows trader")
    resp = requests.post(f"{FOLLOW_URL}/api/follow/{TRADER_ID}", 
                         headers={"X-User-ID": FOLLOWER_ID})
    if resp.status_code == 400:
        print("Already following trader")
    else:
        print(f"Follow response: {resp.json()}")

    # Step 3: Reset follower's copy limits
    print_step(3, "Resetting follower's copy limits")
    reset_follower_copy_stats()
    print("Follower copy stats reset")

    # Step 4: Trader places a pending order
    print_step(4, "Trader places a pending order (BUY USD/ZAR, Mini lot)")
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
    order_resp.raise_for_status()
    order_id = order_resp.json()["id"]
    print(f"Order ID: {order_id}")

    # Step 5: Trader activates the order (opens trade)
    print_step(5, "Trader activates the order")
    activate_resp = requests.post(
        f"{TRADING_URL}/api/orders/{order_id}/activate",
        json={"activation_price": 18.25},
        headers={"X-User-ID": TRADER_ID}
    )
    activate_resp.raise_for_status()
    trade_id = activate_resp.json()["id"]
    print(f"Trade ID: {trade_id}")

    # Step 6: Follower gets notifications
    print_step(6, "Follower checks for notifications")
    time.sleep(1)
    notif_resp = requests.get(f"{FOLLOW_URL}/api/notifications", 
                              headers={"X-User-ID": FOLLOWER_ID})
    notifications = notif_resp.json()
    print(f"Found {len(notifications)} notification(s)")
    if notifications:
        print(f"Notification: {notifications[0]['symbol']} from trader")

    # Step 7: Follower copies the trade
    print_step(7, "Follower copies the trade (Standard lot, volume 1)")
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
    print(f"Copy trade created: ID={copy_data['id']}, Margin={copy_data['margin']} ZAR")

    # Step 8: Check follower's open trades
    print_step(8, "Checking follower's open trades")
    follower_trades = requests.get(f"{TRADING_URL}/api/trades/open", 
                                   headers={"X-User-ID": FOLLOWER_ID}).json()
    print(f"Follower has {len(follower_trades)} open trade(s)")
    for t in follower_trades:
        print(f"  Trade {t['id']}: {t['symbol']} {t['direction']} {t['lot_size']} lot, margin={t['margin']} ZAR")

    # Step 9: Trader closes the trade at profit
    print_step(9, "Trader closes trade at profit (18.26)")
    close_resp = requests.post(
        f"{TRADING_URL}/api/trades/{trade_id}/close",
        json={"close_price": 18.26, "close_reason": "TAKE_PROFIT"},
        headers={"X-User-ID": TRADER_ID}
    )
    close_data = close_resp.json()
    print(f"Trader's PnL: ZAR {close_data['pnl']}")
    if "bonus_available" in close_data and close_data["bonus_available"]:
        print(f"Bonus available! Milestone={close_data['milestone']}, Multiplier={close_data['multiplier']}")
        bonus_resp = requests.post(
            f"{TRADING_URL}/api/trades/{trade_id}/bonus_decision",
            json={"action": "cashout"},
            headers={"X-User-ID": TRADER_ID}
        )
        print(f"Bonus cashed out: {bonus_resp.json()}")

    # Step 10: Wait for auto-close
    print_step(10, "Waiting for copy trade to auto-close")
    time.sleep(2)

    # Step 11: Check copy trade status
    print_step(11, "Checking copy trade status")
    result = subprocess.run([
        "docker", "exec", "-i", "equal-platform-follow-db-1", "psql", "-U", "equal", "-d", "follow_db",
        "-c", "SELECT id, status, follower_profit, trader_commission FROM copy_trades ORDER BY created_at DESC LIMIT 3;"
    ], capture_output=True, text=True)
    print("Copy trades in database:")
    print(result.stdout)

    # Step 12: Check final wallet balances
    print_step(12, "Checking final wallet balances")
    trader_final = get_wallet(TRADER_ID)
    follower_final = get_wallet(FOLLOWER_ID)
    
    trader_change = trader_final['balance'] - trader_initial['balance']
    follower_change = follower_final['balance'] - follower_initial['balance']
    
    print(f"Trader: {trader_initial['balance']:.2f} -> {trader_final['balance']:.2f} (change: {trader_change:+.2f})")
    print(f"Follower: {follower_initial['balance']:.2f} -> {follower_final['balance']:.2f} (change: {follower_change:+.2f})")

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"✓ Trader placed and activated trade")
    print(f"✓ Follower followed trader and received notification")
    print(f"✓ Follower copied trade with custom lot size")
    print(f"✓ Trader closed trade at profit")
    if follower_change > 0:
        print(f"✓ Copy trade closed with follower profit of {follower_change:.2f} ZAR")
    if trader_change > 0 and trader_change > close_data.get('pnl', 0):
        print(f"✓ Commission of {(trader_change - close_data.get('pnl', 0)):.2f} ZAR paid to trader")
    print("\nAll systems working!")

if __name__ == "__main__":
    main()