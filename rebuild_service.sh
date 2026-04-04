#!/bin/bash
# Rebuild and restart a specific service

if [ -z "$1" ]; then
    echo "Usage: ./rebuild_service.sh <service-name>"
    echo ""
    echo "Available services:"
    echo "  wallet-service"
    echo "  trading-service"
    echo "  orbitbet-service"
    echo "  follow-service"
    echo "  arbitrage-service"
    echo "  gateway"
    exit 1
fi

SERVICE=$1

echo "=========================================="
echo "Rebuilding and Restarting: $SERVICE"
echo "=========================================="

docker compose build $SERVICE
docker compose up -d $SERVICE

echo ""
echo "Service $SERVICE rebuilt and restarted."
echo "Check logs with: docker compose logs -f $SERVICE"
