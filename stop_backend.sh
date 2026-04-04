#!/bin/bash
# Stop all backend services

echo "=========================================="
echo "Stopping All Backend Services"
echo "=========================================="

docker compose down

echo ""
echo "All services stopped."
echo "To restart: ./build_backend.sh"
