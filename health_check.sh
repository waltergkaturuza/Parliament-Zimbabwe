#!/bin/bash

# Parliament Fuel System - Server Health Check Script
echo "🏥 Parliament Fuel System - Health Check"
echo "========================================"

BACKEND_URL="https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
FRONTEND_URL="https://jolly-ocean-0e0dee90f.2.azurestaticapps.net"

echo "🌐 Testing Backend: $BACKEND_URL"
echo "🎨 Testing Frontend: $FRONTEND_URL"
echo ""

# Test backend health
echo "1️⃣ Backend Health Check..."
if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health/" | grep -q "200"; then
    echo "✅ Backend is responding (200 OK)"
else
    echo "❌ Backend health check failed"
    echo "   Checking basic connectivity..."
    curl -I "$BACKEND_URL" || echo "❌ Backend not reachable"
fi

# Test backend API
echo "2️⃣ Backend API Check..."
if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/" | grep -q "200"; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API check failed"
fi

# Test CORS
echo "3️⃣ CORS Check..."
CORS_TEST=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS "$BACKEND_URL/api/auth/login/")
if echo "$CORS_TEST" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers present"
else
    echo "❌ CORS headers missing"
    echo "   Response headers:"
    curl -I -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/" 2>/dev/null | head -10
fi

# Test frontend
echo "4️⃣ Frontend Check..."
if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend check failed"
fi

echo ""
echo "🔧 Quick Fix Commands (if needed):"
echo "1. Restart backend: az webapp restart --name parliament-fuel-system-d0bvbjfrdbepdrfh --resource-group DefaultResourceGroup-SAF"
echo "2. Check logs: az webapp log tail --name parliament-fuel-system-d0bvbjfrdbepdrfh --resource-group DefaultResourceGroup-SAF"
echo "3. Deploy latest: git push origin main"

echo ""
echo "Health check complete! 🏁"
