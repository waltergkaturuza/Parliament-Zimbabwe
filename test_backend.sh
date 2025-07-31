#!/bin/bash
echo "Testing backend connectivity..."

echo "1. Basic health check:"
curl -s "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/" | head -10

echo -e "\n2. CORS preflight test:"
curl -X OPTIONS \
  "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/auth/login/" \
  -H "Origin: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  -v

echo -e "\n3. Testing auth endpoint:"
curl -X POST \
  "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/auth/login/" \
  -H "Content-Type: application/json" \
  -H "Origin: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net" \
  -d '{"username":"test","password":"test"}' \
  -v
