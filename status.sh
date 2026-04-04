#!/bin/bash
# Check status of all services

echo "=========================================="
echo "Service Status"
echo "=========================================="
echo ""

docker compose ps

echo ""
echo "=========================================="
echo "Health Checks"
echo "=========================================="

check_service() {
    local name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is not responding"
    fi
}

check_service "Wallet"      "http://localhost:8002/health"
check_service "Trading"     "http://localhost:8003/health"
check_service "Arbitrage"   "http://localhost:8004/health"
check_service "Follow"      "http://localhost:8005/health"
check_service "OrbitBet"    "http://localhost:8006/health"
check_service "Gateway"     "http://localhost:8000/health"

echo ""
echo "To view logs: ./logs.sh <service-name>"
