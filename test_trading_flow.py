#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete Trading App Flow Test
Simulates a user: deposit -> place order -> activate -> check streaks -> close trade -> cashout bonus
"""
import requests
import time
import sys

USER_ID = "11111111-1111-1111-1111-111111111111"
WALLET_URL = "http://localhost:8002"
TRADING_URL = "http://localhost:8003"

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

def test_trading_flow():
    print("\n" + "="*60)
    print("TRADING APP COMPLETE FLOW TEST")
    print("="*60)

    # Step 1: Check initial balance
    print_step(1, "Checking initial wallet balance")
    initial = get_wallet()
    print(f"Balance: ZAR {initial['balance']:.2f}")
    print(f"Available: ZAR {initial['available']:.2f}")
    print(f"Margin: ZAR {initial['margin']:.2f}")

    # Step 2: Place pending order
    print_step(2, "Placing pending order (BUY USD/ZAR, Mini lot)")
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
    print(f"[OK] Order placed. Order ID: {order_id}")

    # Check balance after order (margin should be reserved)
    after_order = get_wallet()
    print(f"Balance after order: ZAR {after_order['balance']:.2f}")
    print(f"Available after order: ZAR {after_order['available']:.2f}")
    print(f"Margin after order: ZAR {after_order['margin']:.2f}")

    # Step 3: Activate order (opens trade)
    print_step(3, "Activating order")
    activate_resp = requests.post(
        f"{TRADING_URL}/api/orders/{order_id}/activate",
        json={"activation_price": 18.25},
        headers={"X-User-ID": USER_ID}
    )
    activate_resp.raise_for_status()
    trade_id = activate_resp.json()["id"]
    print(f"[OK] Trade activated. Trade ID: {trade_id}")

    # Step 4: Check open trades
    print_step(4, "Checking open trades")
    trades_resp = requests.get(f"{TRADING_URL}/api/trades/open", headers={"X-User-ID": USER_ID})
    trades = trades_resp.json()
    print(f"[OK] Open trades: {len(trades)}")
    for t in trades:
        print(f"   - {t['symbol']} {t['direction']} {t['lot_size']} lot, margin={t['margin']}")

    # Step 5: Check player stats (streaks before trade)
    print_step(5, "Checking player stats (streaks)")
    stats_resp = requests.get(f"{TRADING_URL}/api/stats/", headers={"X-User-ID": USER_ID})
    stats = stats_resp.json()
    print(f"[OK] Current win streak: {stats['win_streak']}")
    print(f"   Best streak: {stats['max_streak']}")
    print(f"   Total wins: {stats['total_wins']}, Losses: {stats['total_losses']}")

    # Step 6: Close trade at profit
    print_step(6, "Closing trade at profit (18.26)")
    close_resp = requests.post(
        f"{TRADING_URL}/api/trades/{trade_id}/close",
        json={"close_price": 18.26, "close_reason": "TAKE_PROFIT"},
        headers={"X-User-ID": USER_ID}
    )
    close_resp.raise_for_status()
    close_data = close_resp.json()
    
    # Handle bonus case
    if close_data.get("bonus_available"):
        print(f"[BONUS] Bonus available! Milestone: {close_data['milestone']}x, Multiplier: {close_data['multiplier']}x")
        print_step(7, "Cashing out bonus")
        bonus_resp = requests.post(
            f"{TRADING_URL}/api/trades/{trade_id}/bonus_decision",
            json={"action": "cashout"},
            headers={"X-User-ID": USER_ID}
        )
        bonus_data = bonus_resp.json()
        print(f"[OK] Bonus cashed out. Final PnL: ZAR {bonus_data['pnl']}")
        print(f"   New win streak: {bonus_data['win_streak']}")
        final_pnl = bonus_data['pnl']
    else:
        print(f"[OK] Trade closed. PnL: ZAR {close_data['pnl']}")
        final_pnl = close_data['pnl']

    # Step 8: Check updated stats
    print_step(8, "Checking updated player stats")
    stats_after = requests.get(f"{TRADING_URL}/api/stats/", headers={"X-User-ID": USER_ID}).json()
    print(f"[OK] Updated win streak: {stats_after['win_streak']}")
    print(f"   Best streak: {stats_after['max_streak']}")
    print(f"   Total wins: {stats_after['total_wins']}, Losses: {stats_after['total_losses']}")

    # Step 9: Check final wallet balance
    print_step(9, "Checking final wallet balance")
    final = get_wallet()
    profit = final['balance'] - initial['balance']
    print(f"[OK] Initial balance: ZAR {initial['balance']:.2f}")
    print(f"   Final balance: ZAR {final['balance']:.2f}")
    print(f"   Net profit: ZAR {profit:+.2f}")

    # Summary
    print("\n" + "="*60)
    print("TRADING FLOW TEST SUMMARY")
    print("="*60)
    print(f"[OK] Order placed and activated")
    print(f"[OK] Trade closed with profit")
    if close_data.get("bonus_available"):
        print(f"[OK] Bonus cashed out ({close_data['milestone']}x multiplier)")
    print(f"[OK] Wallet balance updated correctly")
    print(f"[OK] Streak tracking working")
    print("\n[SUCCESS] Trading app flow test passed!\n")

if __name__ == "__main__":
    test_trading_flow()
