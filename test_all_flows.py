#!/usr/bin/env python3
import subprocess
import sys

flows = [
    ("Trading Flow", "test_trading_flow.py"),
    ("Arbitrage Flow", "test_arbitrage_flow.py"),
    ("Copy Trading Flow", "test_copy_trading_flow.py"),
]

def run_flow(name, script):
    print(f"\n{'='*60}")
    print(f"RUNNING {name.upper()}")
    print(f"{'='*60}")
    result = subprocess.run([sys.executable, script], capture_output=False)
    return result.returncode == 0

def main():
    print("\n" + "="*60)
    print("RUNNING ALL COMPLETE FLOW TESTS")
    print("="*60)
    
    failed = []
    for name, script in flows:
        if not run_flow(name, script):
            failed.append(name)
    
    print("\n" + "="*60)
    print("FLOW TEST SUMMARY")
    print("="*60)
    if failed:
        print(f"❌ Failed flows: {', '.join(failed)}")
    else:
        print("✅ All flow tests passed!")
    
    return 0 if not failed else 1

if __name__ == "__main__":
    sys.exit(main())
