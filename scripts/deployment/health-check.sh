#!/bin/bash

# Health Check Script for LUXORANOVA9 Services
# Validates deployment health across different service types

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TIMEOUT=30
RETRIES=3

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Health check functions
check_http_endpoint() {
    local url="$1"
    local name="$2"
    local expected_status="${3:-200}"
    
    log_info "Checking $name at $url"
    
    for i in $(seq 1 $RETRIES); do
        if curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" | grep -q "$expected_status"; then
            log_success "$name is healthy"
            return 0
        else
            log_warning "Attempt $i/$RETRIES failed for $name"
            sleep 5
        fi
    done
    
    log_error "$name health check failed"
    return 1
}

check_docker_service() {
    local service_name="$1"
    
    log_info "Checking Docker service: $service_name"
    
    if docker ps --filter "name=$service_name" --filter "status=running" | grep -q "$service_name"; then
        log_success "Docker service $service_name is running"
        return 0
    else
        log_error "Docker service $service_name is not running"
        return 1
    fi
}

check_database() {
    local db_url="$1"
    local db_type="$2"
    
    log_info "Checking $db_type database connectivity"
    
    case "$db_type" in
        postgres)
            if pg_isready -d "$db_url" -t $TIMEOUT; then
                log_success "PostgreSQL is accessible"
                return 0
            fi
            ;;
        redis)
            if redis-cli -u "$db_url" ping | grep -q "PONG"; then
                log_success "Redis is accessible"
                return 0
            fi
            ;;
    esac
    
    log_error "$db_type database is not accessible"
    return 1
}

# Service-specific health checks
check_saas_apps() {
    log_info "Checking SaaS applications..."
    
    local apps=(
        "http://localhost:3000|LuxoraNova SaaS"
        "http://localhost:3001|Next.js Boilerplate"
        "http://localhost:3002|CodeWeb Chat"
    )
    
    local failed=0
    for app in "${apps[@]}"; do
        IFS='|' read -r url name <<< "$app"
        if ! check_http_endpoint "$url" "$name"; then
            ((failed++))
        fi
    done
    
    return $failed
}

check_ai_services() {
    log_info "Checking AI services..."
    
    local services=(
        "http://localhost:8000|Neura AI Factory"
        "http://localhost:8001|LuxoraNova Brain"
        "http://localhost:8002|Jupyter AI"
    )
    
    local failed=0
    for service in "${services[@]}"; do
        IFS='|' read -r url name <<< "$service"
        if ! check_http_endpoint "$url/health" "$name"; then
            ((failed++))
        fi
    done
    
    return $failed
}

check_infrastructure() {
    log_info "Checking infrastructure services..."
    
    local failed=0
    
    # Check databases
    if ! check_database "postgresql://localhost:5432/luxoranova9" "postgres"; then
        ((failed++))
    fi
    
    if ! check_database "redis://localhost:6379" "redis"; then
        ((failed++))
    fi
    
    # Check Docker services
    local docker_services=(
        "luxoranova9_postgres"
        "luxoranova9_redis"
        "luxoranova9_vector-db"
    )
    
    for service in "${docker_services[@]}"; do
        if ! check_docker_service "$service"; then
            ((failed++))
        fi
    done
    
    return $failed
}

check_tools() {
    log_info "Checking tools and utilities..."
    
    local tools=(
        "npm|Node Package Manager"
        "docker|Docker"
        "git|Git"
        "turbo|Turbo"
    )
    
    local failed=0
    for tool in "${tools[@]}"; do
        IFS='|' read -r cmd name <<< "$tool"
        if command -v "$cmd" >/dev/null 2>&1; then
            log_success "$name is available"
        else
            log_error "$name is not available"
            ((failed++))
        fi
    done
    
    return $failed
}

# Main health check
main() {
    log_info "Starting LUXORANOVA9 health check..."
    
    local total_failed=0
    
    # Run all health checks
    check_tools || ((total_failed+=$?))
    check_infrastructure || ((total_failed+=$?))
    check_saas_apps || ((total_failed+=$?))
    check_ai_services || ((total_failed+=$?))
    
    echo ""
    if [[ $total_failed -eq 0 ]]; then
        log_success "All health checks passed! ✅"
        exit 0
    else
        log_error "$total_failed health check(s) failed! ❌"
        exit 1
    fi
}

# Command line options
case "${1:-all}" in
    saas)
        check_saas_apps
        ;;
    ai)
        check_ai_services
        ;;
    infrastructure|infra)
        check_infrastructure
        ;;
    tools)
        check_tools
        ;;
    all|*)
        main
        ;;
esac