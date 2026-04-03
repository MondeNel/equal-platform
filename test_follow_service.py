#!/usr/bin/env python3
import requests

FOLLOW_URL = "http://localhost:8005"
TRADER_ID = "00000000-0000-0000-0000-000000000001"
FOLLOWER_ID = "11111111-1111-1111-1111-111111111111"

def print_test(name, result, details=""):
    status = "✅ PASS" if result else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"     {details}")

def test_follow_service():
    print("\n" + "="*60)
    print("TESTING FOLLOW SERVICE")
    print("="*60)

    # 1. Health check
    try:
        resp = requests.get(f"{FOLLOW_URL}/health")
        print_test("Health check", resp.status_code == 200, f"Status: {resp.status_code}")
    except Exception as e:
        print_test("Health check", False, str(e))

    # 2. Get leaderboard
    try:
        resp = requests.get(f"{FOLLOW_URL}/api/leaderboard", headers={"X-User-ID": FOLLOWER_ID})
        leaderboard = resp.json()
        print_test("Get leaderboard", len(leaderboard) > 0, f"Found {len(leaderboard)} traders")
    except Exception as e:
        print_test("Get leaderboard", False, str(e))

    # 3. Follow trader
    try:
        resp = requests.post(f"{FOLLOW_URL}/api/follow/{TRADER_ID}", headers={"X-User-ID": FOLLOWER_ID})
        # 400 means already following, which is fine
        print_test("Follow trader", resp.status_code in [200, 400], f"Status: {resp.status_code}")
    except Exception as e:
        print_test("Follow trader", False, str(e))

    # 4. Get following list
    try:
        resp = requests.get(f"{FOLLOW_URL}/api/following", headers={"X-User-ID": FOLLOWER_ID})
        following = resp.json()
        print_test("Get following", len(following) > 0, f"Following {len(following)} trader(s)")
    except Exception as e:
        print_test("Get following", False, str(e))

    # 5. Check copy limit
    try:
        resp = requests.get(f"{FOLLOW_URL}/api/copy/limit", headers={"X-User-ID": FOLLOWER_ID})
        limit_data = resp.json()
        print_test("Check copy limit", "can_copy" in limit_data, f"Can copy: {limit_data.get('can_copy', False)}")
    except Exception as e:
        print_test("Check copy limit", False, str(e))

    # 6. Get notifications (may be empty)
    try:
        resp = requests.get(f"{FOLLOW_URL}/api/notifications", headers={"X-User-ID": FOLLOWER_ID})
        notifications = resp.json()
        print_test("Get notifications", True, f"Found {len(notifications)} notification(s)")
    except Exception as e:
        print_test("Get notifications", False, str(e))

    # 7. Unfollow trader
    try:
        resp = requests.delete(f"{FOLLOW_URL}/api/follow/{TRADER_ID}", headers={"X-User-ID": FOLLOWER_ID})
        print_test("Unfollow trader", resp.status_code == 200, "Success")
    except Exception as e:
        print_test("Unfollow trader", False, str(e))

    print("\n✅ Follow service tests completed\n")

if __name__ == "__main__":
    test_follow_service()
