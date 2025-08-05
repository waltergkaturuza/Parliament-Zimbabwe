#!/bin/bash

# Parliament Fuel System - Post-Deployment Verification Script
# This script tests all critical functionality after deployment

# Configuration
BASE_URL="${1:-https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net}"
FRONTEND_URL="${2:-https://jolly-ocean-0e0dee90f.2.azurestaticapps.net}"
TIMEOUT=30
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with colors
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    ((TOTAL_TESTS++))
}

# Function to test HTTP endpoint
test_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    local method="${4:-GET}"
    
    log_test "$description"
    
    local response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        -X "$method" \
        -H "Accept: application/json" \
        -H "User-Agent: Parliament-Deployment-Test/1.0" \
        --max-time $TIMEOUT \
        "$url" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local status_code=$(echo "$response" | tail -n 2 | head -n 1)
        local time_total=$(echo "$response" | tail -n 1)
        local body=$(echo "$response" | head -n -2)
        
        if [ "$status_code" = "$expected_status" ]; then
            log_success "$description (${status_code}, ${time_total}s)"
            return 0
        else
            log_error "$description - Expected $expected_status, got $status_code"
            echo "Response: $body"
            return 1
        fi
    else
        log_error "$description - Connection failed"
        return 1
    fi
}

# Function to test CORS
test_cors() {
    local url="$1"
    local origin="$2"
    local description="$3"
    
    log_test "$description"
    
    local headers=$(curl -s -I \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        -X OPTIONS \
        --max-time $TIMEOUT \
        "$url" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        if echo "$headers" | grep -i "access-control-allow-origin" > /dev/null; then
            log_success "$description"
            return 0
        else
            log_error "$description - No CORS headers found"
            echo "Headers: $headers"
            return 1
        fi
    else
        log_error "$description - CORS preflight failed"
        return 1
    fi
}

# Function to test JSON API response
test_json_api() {
    local url="$1"
    local description="$2"
    local expected_field="$3"
    
    log_test "$description"
    
    local response=$(curl -s \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        --max-time $TIMEOUT \
        "$url" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        if echo "$response" | grep -q "$expected_field"; then
            log_success "$description"
            return 0
        else
            log_error "$description - Expected field '$expected_field' not found"
            echo "Response: $response"
            return 1
        fi
    else
        log_error "$description - API call failed"
        return 1
    fi
}

# Start verification
echo "🏛️ Parliament Fuel System - Post-Deployment Verification"
echo "=================================================="
echo "Backend URL: $BASE_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

log_info "Starting comprehensive deployment verification..."

# Basic connectivity tests
echo ""
log_info "🔌 Basic Connectivity Tests"
echo "-----------------------------"
test_endpoint "$BASE_URL/" "Backend root endpoint"
test_endpoint "$BASE_URL/health/simple/" "Simple health check"
test_endpoint "$BASE_URL/health/" "Detailed health check"
test_endpoint "$FRONTEND_URL/" "Frontend availability"

# API endpoint tests
echo ""
log_info "🔌 API Endpoint Tests"
echo "----------------------"
test_endpoint "$BASE_URL/api/" "API root endpoint"
test_endpoint "$BASE_URL/admin/" "Django admin interface"
test_endpoint "$BASE_URL/api/schema/" "API schema endpoint"

# CORS tests
echo ""
log_info "🌐 CORS Configuration Tests"
echo "-----------------------------"
test_cors "$BASE_URL/api/" "$FRONTEND_URL" "CORS from frontend to API"
test_cors "$BASE_URL/health/" "$FRONTEND_URL" "CORS from frontend to health"

# JSON API structure tests
echo ""
log_info "📋 API Structure Tests"
echo "-----------------------"
test_json_api "$BASE_URL/" "Root API structure" "message"
test_json_api "$BASE_URL/health/" "Health API structure" "status"

# Authentication endpoint tests
echo ""
log_info "🔐 Authentication Tests"
echo "------------------------"
test_endpoint "$BASE_URL/api/auth/login/" "Login endpoint" "405" "GET"  # Should return 405 Method Not Allowed for GET
test_endpoint "$BASE_URL/api/token/refresh/" "Token refresh endpoint" "401" "GET"  # Should require authentication

# Database connectivity (through API)
echo ""
log_info "🗄️ Database Connectivity Tests"
echo "-------------------------------"
# Test an endpoint that requires database access
test_endpoint "$BASE_URL/admin/login/" "Database-dependent admin login page"

# Static files test
echo ""
log_info "📁 Static Files Tests"
echo "----------------------"
test_endpoint "$BASE_URL/static/" "Static files directory" "404"  # Expected 404 for directory listing

# Performance tests
echo ""
log_info "⚡ Performance Tests"
echo "--------------------"
log_test "Response time test (should be < 5s)"
start_time=$(date +%s.%N)
curl -s "$BASE_URL/health/simple/" > /dev/null
end_time=$(date +%s.%N)
response_time=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "unknown")

if [ "$response_time" != "unknown" ] && (( $(echo "$response_time < 5.0" | bc -l 2>/dev/null || echo 0) )); then
    log_success "Response time: ${response_time}s"
else
    log_warning "Response time: ${response_time}s (may be slow)"
fi

# SSL/TLS tests
echo ""
log_info "🔒 Security Tests"
echo "-----------------"
if echo "$BASE_URL" | grep -q "https://"; then
    log_test "SSL certificate validation"
    if curl -s --fail --connect-timeout 10 "$BASE_URL/health/simple/" > /dev/null; then
        log_success "SSL certificate is valid"
    else
        log_error "SSL certificate validation failed"
    fi
else
    log_warning "Backend not using HTTPS"
fi

# Frontend integration test
echo ""
log_info "🔗 Frontend Integration Tests"
echo "------------------------------"
if [ "$FRONTEND_URL" != "" ]; then
    test_endpoint "$FRONTEND_URL/" "Frontend homepage"
    
    # Test if frontend can reach backend (basic connectivity)
    log_test "Frontend to Backend connectivity simulation"
    if curl -s -H "Origin: $FRONTEND_URL" "$BASE_URL/health/simple/" > /dev/null; then
        log_success "Frontend can reach backend"
    else
        log_error "Frontend cannot reach backend"
    fi
else
    log_warning "Frontend URL not provided, skipping integration tests"
fi

# Generate summary report
echo ""
echo "=================================================="
echo "🏛️ Verification Summary"
echo "=================================================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Deployment appears successful.${NC}"
    exit 0
elif [ $FAILED_TESTS -lt 3 ]; then
    echo -e "${YELLOW}⚠️ Some tests failed, but deployment may be functional.${NC}"
    exit 1
else
    echo -e "${RED}❌ Multiple tests failed. Deployment needs attention.${NC}"
    exit 2
fi
