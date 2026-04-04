#!/bin/bash
# Build and start all backend services for the trading platform

set -e

echo "=========================================="
echo "Building and Starting Backend Services"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if docker and docker-compose are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Dependencies OK"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p services/trading-service/app/routers
    mkdir -p services/trading-service/app/services
    mkdir -p services/trading-service/app/models
    mkdir -p services/wallet-service/app/routers
    mkdir -p services/wallet-service/app/services
    mkdir -p services/wallet-service/app/models
    mkdir -p services/orbitbet-service/app/routers
    mkdir -p services/orbitbet-service/app/services
    mkdir -p services/orbitbet-service/app/models
    mkdir -p services/follow-service/app/routers
    mkdir -p services/follow-service/app/services
    mkdir -p services/follow-service/app/models
    mkdir -p services/arbitrage-service/app/routers
    mkdir -p services/arbitrage-service/app/services
    mkdir -p services/arbitrage-service/app/models
    mkdir -p frontend/trading-app/src/components
    mkdir -p frontend/trading-app/src/hooks
    mkdir -p frontend/orbitbet-app/src/components
    mkdir -p frontend/orbitbet-app/src/hooks
}

# Build and start services
build_and_start() {
    print_status "Building and starting all services..."
    
    # Pull latest images
    docker compose pull
    
    # Build all services
    docker compose build --parallel
    
    # Start all services in detached mode
    docker compose up -d
    
    print_status "Waiting for services to become healthy..."
}

# Check individual service health with retry
check_service_health() {
    local name=$1
    local port=$2
    local endpoint=$3
    local max_retries=$4
    local retry_delay=$5
    
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if curl -s -f "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            print_status "$name is healthy on port $port (attempt $((retry+1))/$max_retries)"
            return 0
        else
            retry=$((retry+1))
            if [ $retry -lt $max_retries ]; then
                print_warning "$name not ready yet (attempt $retry/$max_retries). Waiting $retry_delay seconds..."
                sleep $retry_delay
            fi
        fi
    done
    
    print_error "$name failed to become healthy after $max_retries attempts"
    return 1
}

# Check all services with individual retry logic
check_all_services() {
    print_status "Checking service health with individual retry logic..."
    
    # Define services: (name, port, endpoint, max_retries, retry_delay)
    local services=(
        "wallet-service:8002:/health:30:2"
        "trading-service:8003:/health:40:3"
        "arbitrage-service:8004:/health:30:2"
        "follow-service:8005:/health:30:2"
        "orbitbet-service:8006:/health:30:2"
        "gateway:8000:/health:30:2"
    )
    
    local failed_services=()
    
    for service_config in "${services[@]}"; do
        IFS=':' read -r name port endpoint max_retries retry_delay <<< "$service_config"
        
        if check_service_health "$name" "$port" "$endpoint" "$max_retries" "$retry_delay"; then
            print_status "$name ✓"
        else
            print_error "$name ✗"
            failed_services+=("$name")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_status "All services are healthy!"
        return 0
    else
        print_error "The following services failed: ${failed_services[*]}"
        print_warning "Check logs with: docker compose logs ${failed_services[*]}"
        return 1
    fi
}

# Show running containers
show_containers() {
    print_status "Running containers:"
    docker compose ps
}

# Show logs for failed services
show_failed_logs() {
    local failed_services=("$@")
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        echo ""
        print_warning "Showing last 20 lines of logs for failed services:"
        echo "=========================================="
        
        for service in "${failed_services[@]}"; do
            echo ""
            echo "--- Logs for $service ---"
            docker logs --tail=20 "equal-platform-$service-1" 2>/dev/null || echo "No logs available"
        done
    fi
}

# Main execution
main() {
    check_dependencies
    create_directories
    build_and_start
    
    # Check all services with individual retry logic
    if check_all_services; then
        show_containers
        
        echo ""
        echo "=========================================="
        echo "Backend Services Started Successfully!"
        echo "=========================================="
        echo ""
        echo "Service URLs:"
        echo "  Gateway:      http://localhost:8000"
        echo "  Wallet:       http://localhost:8002"
        echo "  Trading:      http://localhost:8003"
        echo "  Arbitrage:    http://localhost:8004"
        echo "  Follow:       http://localhost:8005"
        echo "  OrbitBet:     http://localhost:8006"
        echo ""
        echo "To view logs:   docker compose logs -f"
        echo "To stop:        docker compose down"
        echo "To restart:     ./build_backend.sh"
    else
        # Collect failed services
        local failed=()
        for service in gateway trading-service arbitrage-service follow-service orbitbet-service wallet-service; do
            case $service in
                gateway)
                    if ! curl -s -f "http://localhost:8000/health" > /dev/null 2>&1; then
                        failed+=("$service")
                    fi
                    ;;
                wallet-service)
                    if ! curl -s -f "http://localhost:8002/health" > /dev/null 2>&1; then
                        failed+=("$service")
                    fi
                    ;;
                trading-service)
                    if ! curl -s -f "http://localhost:8003/health" > /dev/null 2>&1; then
                        failed+=("$service")
                    fi
                    ;;
                arbitrage-service)
                    if ! curl -s -f "http://localhost:8004/health" > /dev/null 2>&1; then
                        failed+=("$service")
                    fi
                    ;;
                follow-service)
                    if ! curl -s -f "http://localhost:8005/health" > /dev/null 2>&1; then
                        failed+=("$service")
                    fi
                    ;;
                orbitbet-service)
                    if ! curl -s -f "http://localhost:8006/health" > /dev/null 2>&1; then
                        failed+=("$service")
                    fi
                    ;;
            esac
        done
        
        show_failed_logs "${failed[@]}"
        exit 1
    fi
}

main
