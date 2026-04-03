#!/usr/bin/env python3
import requests
import time

ORBIT_URL = "http://localhost:8006"
USER_ID = "11111111-1111-1111-1111-111111111111"

def print_test(name, result, details=""):
    status = "✅ PASS" if result else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"     {details}")

def test_orbitbet_service():
    print("\n" + "="*60)
    print("TESTING ORBITBET SERVICE")
    print("="*60)

    # 1. Health check
    try:
        resp = requests.get(f"{ORBIT_URL}/health")
        print_test("Health check", resp.status_code == 200, f"Status: {resp.status_code}")
    except Exception as e:
        print_test("Health check", False, str(e))

    # 2. Place bet
    try:
        resp = requests.post(f"{ORBIT_URL}/api/bet/place",
                            json={"symbol": "BTC/USD", "direction": "UP", "stake": 50},
                            headers={"X-User-ID": USER_ID})
        bet_id = resp.json().get("bet_id")
        print_test("Place bet", resp.status_code == 200, f"Bet ID: {bet_id}")
    except Exception as e:
        print_test("Place bet", False, str(e))

    # 3. Get active bet
    try:
        resp = requests.get(f"{ORBIT_URL}/api/bet/active", headers={"X-User-ID": USER_ID})
        data = resp.json()
        print_test("Get active bet", data.get("has_active_bet", False), f"Round: {data.get('current_round', 'N/A')}")
    except Exception as e:
        print_test("Get active bet", False, str(e))

    # 4. Resolve rounds (3 rounds)
    for round_num in range(1, 4):
        try:
            resp = requests.post(f"{ORBIT_URL}/api/bet/round",
                                json={"bet_id": bet_id, "chosen_direction": "UP"},
                                headers={"X-User-ID": USER_ID})
            data = resp.json()
            print_test(f"Resolve round {round_num}", resp.status_code == 200, f"Result: {data.get('result', 'N/A')}")
        except Exception as e:
            print_test(f"Resolve round {round_num}", False, str(e))
        time.sleep(0.5)

    # 5. Get player stats
    try:
        resp = requests.get(f"{ORBIT_URL}/api/bet/stats", headers={"X-User-ID": USER_ID})
        stats = resp.json()
        print_test("Get player stats", "total_bets" in stats, f"Total bets: {stats.get('total_bets', 0)}")
    except Exception as e:
        print_test("Get player stats", False, str(e))

    # 6. Get bet history
    try:
        resp = requests.get(f"{ORBIT_URL}/api/bet/history", headers={"X-User-ID": USER_ID})
        history = resp.json()
        print_test("Get bet history", len(history) > 0, f"Found {len(history)} bet(s)")
    except Exception as e:
        print_test("Get bet history", False, str(e))

    print("\n✅ OrbitBet service tests completed\n")

if __name__ == "__main__":
    test_orbitbet_service()
