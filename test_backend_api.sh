#!/bin/bash
echo "=== Testing Backend API Endpoints ==="
echo ""

# Test 1: Health check
echo "1. Testing Health Endpoint:"
echo "URL: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/"
curl -v "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/" 2>&1 | head -20
echo ""
echo ""

# Test 2: Auth endpoint
echo "2. Testing Auth Login Endpoint (OPTIONS request - CORS preflight):"
echo "URL: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/v1/auth/login/"
curl -X OPTIONS \
  -H "Origin: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/v1/auth/login/" 2>&1 | head -20
echo ""
echo ""

# Test 3: Actual login attempt
echo "3. Testing Actual Login Endpoint:"
curl -X POST \
  -H "Origin: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/v1/auth/login/" 2>&1 | head -20
echo ""
echo ""

echo "=== Test Complete ==="
echo ""
echo "Look for:"
echo "- Status 200 for health check"
echo "- Status 200 for OPTIONS request with CORS headers"
echo "- Proper CORS headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods"
