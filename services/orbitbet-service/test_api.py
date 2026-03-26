#!/usr/bin/env python3
"""
Test script for OrbitBet API endpoints.
Run this after starting the service to verify all endpoints work.
"""
import asyncio
import httpx
import json
from decimal import Decimal
import uuid

BASE_URL = "http://localhost:8006"
TEST_USER_ID = "11111111-1111-1111-1111-111111111111"

async def test_health():
    """Test health endpoint."""
    print("\n=== Testing Health Endpoint ===")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        return True

async def test_place_bet():
    """Test placing a bet."""
    print("\n=== Testing Place Bet ===")
    async with httpx.AsyncClient() as client:
        payload = {
            "symbol": "BTC/USD",
            "direction": "UP",
            "stake": 100.00
        }
        
        response = await client.post(
            f"{BASE_URL}/api/bet/place",
            json=payload,
            headers={"X-User-ID": TEST_USER_ID}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            assert "bet_id" in data
            return data["bet_id"]
        else:
            print(f"Error: {response.text}")
            return None

async def test_resolve_round(bet_id: str, round_num: int, direction: str):
    """Test resolving a round."""
    print(f"\n=== Testing Round {round_num} ===")
    async with httpx.AsyncClient() as client:
        payload = {
            "bet_id": bet_id,
            "chosen_direction": direction
        }
        
        response = await client.post(
            f"{BASE_URL}/api/bet/round",
            json=payload,
            headers={"X-User-ID": TEST_USER_ID}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        return data

async def test_active_bet():
    """Test getting active bet."""
    print("\n=== Testing Active Bet ===")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/api/bet/active",
            headers={"X-User-ID": TEST_USER_ID}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        assert response.status_code == 200
        return response.json()

async def test_player_stats():
    """Test getting player stats."""
    print("\n=== Testing Player Stats ===")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/api/bet/stats",
            headers={"X-User-ID": TEST_USER_ID}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        assert response.status_code == 200
        return response.json()

async def test_bet_history():
    """Test bet history."""
    print("\n=== Testing Bet History ===")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/api/bet/history",
            headers={"X-User-ID": TEST_USER_ID}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        assert response.status_code == 200
        return response.json()

async def test_unclaimed_bonuses():
    """Test getting unclaimed bonuses."""
    print("\n=== Testing Unclaimed Bonuses ===")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/api/bet/bonuses",
            headers={"X-User-ID": TEST_USER_ID}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        assert response.status_code == 200
        return response.json()

async def run_full_game():
    """Run a complete game simulation."""
    print("\n" + "="*50)
    print("Running Complete OrbitBet Game Simulation")
    print("="*50)
    
    # Place bet
    bet_id = await test_place_bet()
    if not bet_id:
        print("❌ Failed to place bet")
        return
    
    print(f"✅ Bet placed with ID: {bet_id}")
    
    # Round 1 - Choose UP
    result1 = await test_resolve_round(bet_id, 1, "UP")
    print(f"Round 1 Result: {result1['result']}")
    
    # Round 2 - Choose DOWN
    result2 = await test_resolve_round(bet_id, 2, "DOWN")
    print(f"Round 2 Result: {result2['result']}")
    
    # Round 3 - Choose UP
    result3 = await test_resolve_round(bet_id, 3, "UP")
    print(f"Round 3 Result: {result3['result']}")
    
    # Show final result
    print("\n" + "="*30)
    print("FINAL RESULT:")
    print(f"Status: {result3.get('final_result')}")
    if result3.get('payout'):
        print(f"Payout: R{result3['payout']}")
    if result3.get('streak_stats'):
        print(f"Streak Stats: {result3['streak_stats']}")
    print("="*30)

async def main():
    """Main test runner."""
    print("Starting OrbitBet API Tests")
    print("Ensure the service is running on port 8006")
    print("="*50)
    
    try:
        # Test health first
        await test_health()
        
        # Run a complete game
        await run_full_game()
        
        # Get stats after game
        await test_player_stats()
        
        # Get bet history
        await test_bet_history()
        
        # Get active bet (should be none)
        active = await test_active_bet()
        if not active.get('has_active_bet'):
            print("✅ No active bets - game completed successfully")
        
        # Check bonuses
        await test_unclaimed_bonuses()
        
        print("\n" + "="*50)
        print("✅ All tests completed successfully!")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())