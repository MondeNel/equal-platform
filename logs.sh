#!/bin/bash
# View logs for services

if [ -z "$1" ]; then
    echo "Usage: ./logs.sh <service-name>"
    echo ""
    echo "Available services:"
    echo "  wallet-service"
    echo "  trading-service"
    echo "  orbitbet-service"
    echo "  follow-service"
    echo "  arbitrage-service"
    echo "  gateway"
    echo "  all (all services)"
    exit 1
fi

SERVICE=$1

if [ "$SERVICE" = "all" ]; then
    docker compose logs -f
else
    docker compose logs -f $SERVICE
fi
