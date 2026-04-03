#!/usr/bin/env python3
import requests
import json
import time

WALLET_URL = "http://localhost:8002"
USER_ID = "11111111-1111-1111-1111-111111111111"

def print_test(name, result, details=""):
    status = "✅ PASS" if result else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"     {details}")

def get_wallet():
    resp = requests.get(f"{WALLET_URL}/api/wallet/", headers={"X-User-ID": USER_ID})
    resp.raise_for_status()
    data = resp.json()
    # Convert string values to float for calculations
    return {
        "balance": float(data.get("balance", 0)),
        "margin": float(data.get("margin", 0)),
        "available": float(data.get("available", 0))
    }

def test_wallet_service():
    print("\n" + "="*60)
    print("TESTING WALLET SERVICE")
    print("="*60)

    # 1. Health check
    try:
        resp = requests.get(f"{WALLET_URL}/health")
        print_test("Health check", resp.status_code == 200, f"Status: {resp.status_code}")
    except Exception as e:
        print_test("Health check", False, str(e))

    # 2. Deposit
    try:
        initial = get_wallet()
        resp = requests.post(f"{WALLET_URL}/api/wallet/deposit", 
                            json={"amount": 100},
                            headers={"X-User-ID": USER_ID})
        after = get_wallet()
        expected = initial["balance"] + 100
        print_test("Deposit", abs(after["balance"] - expected) < 0.01, 
                  f"Balance: {initial['balance']:.2f} -> {after['balance']:.2f}")
    except Exception as e:
        print_test("Deposit", False, str(e))

    # 3. Reserve
    try:
        initial = get_wallet()
        resp = requests.post(f"{WALLET_URL}/api/wallet/reserve",
                            json={"amount": 50, "reference": "test-reserve"},
                            headers={"X-User-ID": USER_ID})
        after = get_wallet()
        expected_margin = initial["margin"] + 50
        print_test("Reserve", abs(after["margin"] - expected_margin) < 0.01,
                  f"Margin: {initial['margin']:.2f} -> {after['margin']:.2f}")
    except Exception as e:
        print_test("Reserve", False, str(e))

    # 4. Release with profit
    try:
        initial = get_wallet()
        resp = requests.post(f"{WALLET_URL}/api/wallet/release",
                            json={"amount": 50, "reference": "test-release", "pnl": 10},
                            headers={"X-User-ID": USER_ID})
        after = get_wallet()
        expected_balance = initial["balance"] + 10
        expected_margin = initial["margin"] - 50
        balance_ok = abs(after["balance"] - expected_balance) < 0.01
        margin_ok = abs(after["margin"] - expected_margin) < 0.01
        print_test("Release with profit", balance_ok and margin_ok,
                  f"Balance: {initial['balance']:.2f} -> {after['balance']:.2f}, Margin: {initial['margin']:.2f} -> {after['margin']:.2f}")
    except Exception as e:
        print_test("Release with profit", False, str(e))

    # 5. Withdraw
    try:
        initial = get_wallet()
        resp = requests.post(f"{WALLET_URL}/api/wallet/withdraw",
                            json={"amount": 50},
                            headers={"X-User-ID": USER_ID})
        after = get_wallet()
        expected = initial["balance"] - 50
        print_test("Withdraw", abs(after["balance"] - expected) < 0.01,
                  f"Balance: {initial['balance']:.2f} -> {after['balance']:.2f}")
    except Exception as e:
        print_test("Withdraw", False, str(e))

    print("\n✅ Wallet service tests completed\n")

if __name__ == "__main__":
    test_wallet_service()
