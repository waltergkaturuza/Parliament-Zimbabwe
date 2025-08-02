# Fix frontend API configuration and redeploy
Write-Host "🔧 FIXING FRONTEND API CONFIGURATION" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Show current issue
Write-Host "❌ Current Issue: Frontend trying to reach wrong backend URL" -ForegroundColor Red
Write-Host "   Frontend URL: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net" -ForegroundColor Yellow
Write-Host "   Wrong Backend: https://parliament-fuel-system.azurewebsites.net (DNS error)" -ForegroundColor Red
Write-Host "   Correct Backend: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net" -ForegroundColor Green
Write-Host ""

# Step 1: Commit any current changes to ensure clean state
Write-Host "🔄 Step 1: Ensuring clean git state..." -ForegroundColor Yellow
git add .
git commit -m "Save current state before frontend API fix"
if ($LASTEXITCODE -ne 0) { Write-Host "No changes to commit" -ForegroundColor Gray }

# Step 2: Verify environment variables in workflow
Write-Host "🔍 Step 2: Checking workflow configuration..." -ForegroundColor Yellow
Select-String -Path ".github/workflows/azure-static-web-apps-jolly-ocean-0e0dee90f.yml" -Pattern "VITE_API_BASE_URL"

# Step 3: Add debugging to frontend build
Write-Host "📝 Step 3: Adding build-time environment variable debug..." -ForegroundColor Yellow
$debugEnvContent = @"
// Debug environment variables during build
console.log('=== BUILD TIME ENVIRONMENT ===');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('All VITE_ vars:', import.meta.env);
console.log('==============================');
"@

Set-Content -Path "fuel-coupon-frontend/debug-env.js" -Value $debugEnvContent

# Add debug import to main.tsx (backup first)
Copy-Item "fuel-coupon-frontend/src/main.tsx" "fuel-coupon-frontend/src/main.tsx.bak"
$mainContent = Get-Content "fuel-coupon-frontend/src/main.tsx"
$newMainContent = 'import "./debug-env.js";' + "`n" + ($mainContent -join "`n")
Set-Content -Path "fuel-coupon-frontend/src/main.tsx" -Value $newMainContent

# Step 4: Force rebuild by updating timestamp
Write-Host "⏰ Step 4: Forcing cache bust..." -ForegroundColor Yellow
$timestamp = "// Build timestamp: $(Get-Date)"
Add-Content -Path "fuel-coupon-frontend/src/vite-env.d.ts" -Value $timestamp

# Step 5: Push changes to trigger new deployment
Write-Host "🚀 Step 5: Triggering new deployment..." -ForegroundColor Yellow

$commitMessage = @"
Fix frontend API URL configuration - force rebuild with debug

- Add environment variable debugging
- Force cache bust with timestamp
- Ensure VITE_API_BASE_URL is applied correctly
- Target: parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net
"@

git add .
git commit -m $commitMessage
git push origin main

Write-Host ""
Write-Host "✅ DEPLOYMENT TRIGGERED" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "🔄 GitHub Actions is now rebuilding the frontend with correct environment variables" -ForegroundColor Cyan
Write-Host "🕒 This will take 3-5 minutes" -ForegroundColor Yellow
Write-Host "🌐 Monitor deployment: https://github.com/waltergkaturuza/Parliament-Zimbabwe/actions" -ForegroundColor Blue
Write-Host "📱 Test URL: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net" -ForegroundColor Blue
Write-Host ""
Write-Host "Expected fix:" -ForegroundColor Green
Write-Host "✅ Frontend will use: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net" -ForegroundColor Green
Write-Host "✅ CORS will work properly" -ForegroundColor Green
Write-Host "✅ Login should function correctly" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 If still not working, check browser console for the debug output" -ForegroundColor Cyan

Read-Host "Press Enter to continue"
