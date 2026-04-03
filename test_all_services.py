#!/usr/bin/env python3
import subprocess
import sys

services = [
    ("Wallet Service", "test_wallet_service.py"),
    ("Trading Service", "test_trading_service.py"),
    ("OrbitBet Service", "test_orbitbet_service.py"),
    ("Follow Service", "test_follow_service.py"),
    ("Arbitrage Service", "test_arbitrage_service.py"),
]

def run_test(name, script):
    print(f"\n{'='*60}")
    print(f"RUNNING {name.upper()} TESTS")
    print(f"{'='*60}")
    result = subprocess.run([sys.executable, script], capture_output=False)
    return result.returncode == 0

def main():
    print("\n" + "="*60)
    print("RUNNING ALL SERVICE TESTS")
    print("="*60)
    
    failed = []
    for name, script in services:
        if not run_test(name, script):
            failed.append(name)
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    if failed:
        print(f"❌ Failed services: {', '.join(failed)}")
    else:
        print("✅ All services passed!")
    
    return 0 if not failed else 1

if __name__ == "__main__":
    sys.exit(main())
