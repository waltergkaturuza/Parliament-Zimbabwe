#!/bin/bash

echo "🔍 CORS Issue Debugging for Parliament Fuel System"
echo "=================================================="
echo ""

echo "🎯 Current Configuration:"
echo "Frontend URL: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net"
echo "Backend URL:  https://parliament-fuel-system.azurewebsites.net"
echo ""

echo "🧪 Testing Backend Endpoint..."
curl -I -X OPTIONS \
  -H "Origin: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://parliament-fuel-system.azurewebsites.net/api/auth/login/

echo ""
echo "🔧 Testing Direct Backend Health..."
curl -I https://parliament-fuel-system.azurewebsites.net/api/health/

echo ""
echo "📋 CORS Fix Status:"
echo "✅ Updated backend URL in GitHub Actions"
echo "✅ Fixed CORS_ALLOWED_ORIGINS in Django"
echo "✅ Added comprehensive CORS headers"
echo "✅ Added CORS debug middleware"
echo ""

echo "⏳ Deployment should complete in 5-10 minutes"
echo "🔄 Frontend will rebuild with correct backend URL"
echo "🔄 Backend will restart with new CORS settings"
echo ""

echo "🎯 After deployment, try login again!"
