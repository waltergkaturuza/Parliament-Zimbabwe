#!/bin/bash
# Fix frontend API configuration and redeploy

echo "🔧 FIXING FRONTEND API CONFIGURATION"
echo "=================================="

# Show current issue
echo "❌ Current Issue: Frontend trying to reach wrong backend URL"
echo "   Frontend URL: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net"
echo "   Wrong Backend: https://parliament-fuel-system.azurewebsites.net (DNS error)"
echo "   Correct Backend: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
echo ""

# Step 1: Commit any current changes to ensure clean state
echo "🔄 Step 1: Ensuring clean git state..."
git add .
git commit -m "Save current state before frontend API fix" || echo "No changes to commit"

# Step 2: Verify environment variables in workflow
echo "🔍 Step 2: Checking workflow configuration..."
grep -n "VITE_API_BASE_URL" .github/workflows/azure-static-web-apps-jolly-ocean-0e0dee90f.yml

# Step 3: Add debugging to frontend build
echo "📝 Step 3: Adding build-time environment variable debug..."
cat > fuel-coupon-frontend/debug-env.js << 'EOF'
// Debug environment variables during build
console.log('=== BUILD TIME ENVIRONMENT ===');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('All VITE_ vars:', import.meta.env);
console.log('==============================');
EOF

# Add debug import to main.tsx
sed -i.bak '1i import "./debug-env.js";' fuel-coupon-frontend/src/main.tsx

# Step 4: Force rebuild by updating timestamp
echo "⏰ Step 4: Forcing cache bust..."
echo "// Build timestamp: $(date)" >> fuel-coupon-frontend/src/vite-env.d.ts

# Step 5: Push changes to trigger new deployment
echo "🚀 Step 5: Triggering new deployment..."
git add .
git commit -m "Fix frontend API URL configuration - force rebuild with debug

- Add environment variable debugging
- Force cache bust with timestamp
- Ensure VITE_API_BASE_URL is applied correctly
- Target: parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

git push origin main

echo ""
echo "✅ DEPLOYMENT TRIGGERED"
echo "======================"
echo "🔄 GitHub Actions is now rebuilding the frontend with correct environment variables"
echo "🕒 This will take 3-5 minutes"
echo "🌐 Monitor deployment: https://github.com/waltergkaturuza/Parliament-Zimbabwe/actions"
echo "📱 Test URL: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net"
echo ""
echo "Expected fix:"
echo "✅ Frontend will use: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
echo "✅ CORS will work properly"
echo "✅ Login should function correctly"
echo ""
echo "🔍 If still not working, check browser console for the debug output"
