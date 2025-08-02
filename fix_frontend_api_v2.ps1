# Frontend API Fix Script for PowerShell
Write-Host "🔧 Starting Frontend API Configuration Fix..." -ForegroundColor Cyan

# Step 1: Check current environment
Write-Host "📋 Checking current environment..." -ForegroundColor Yellow
if (Test-Path "fuel-coupon-frontend") {
    Write-Host "✅ Frontend directory found" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend directory not found" -ForegroundColor Red
    exit 1
}

# Step 2: Backup and create debug environment file
Write-Host "🛠️ Creating environment debug file..." -ForegroundColor Yellow
$debugEnvContent = @"
// Environment Variables Debug
console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('All VITE_ vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
console.log('Full env object:', import.meta.env);
console.log('Expected URL: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net');
console.log('=======================================');
"@

Set-Content -Path "fuel-coupon-frontend/debug-env.js" -Value $debugEnvContent -Encoding UTF8

# Step 3: Backup and modify main.tsx to include debug
Write-Host "🔧 Adding debug import to main.tsx..." -ForegroundColor Yellow
if (Test-Path "fuel-coupon-frontend/src/main.tsx") {
    Copy-Item "fuel-coupon-frontend/src/main.tsx" "fuel-coupon-frontend/src/main.tsx.bak"
    $mainContent = Get-Content "fuel-coupon-frontend/src/main.tsx" -Raw
    $newMainContent = "import './debug-env.js';`n" + $mainContent
    Set-Content -Path "fuel-coupon-frontend/src/main.tsx" -Value $newMainContent -Encoding UTF8
    Write-Host "✅ Debug import added to main.tsx" -ForegroundColor Green
} else {
    Write-Host "❌ main.tsx not found" -ForegroundColor Red
}

# Step 4: Force rebuild by updating timestamp
Write-Host "⏰ Forcing rebuild..." -ForegroundColor Yellow
$viteConfig = "fuel-coupon-frontend/vite.config.ts"
if (Test-Path $viteConfig) {
    $content = Get-Content $viteConfig -Raw
    $timestampComment = "// Force rebuild: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    $newContent = $timestampComment + "`n" + $content
    Set-Content -Path $viteConfig -Value $newContent -Encoding UTF8
    Write-Host "✅ Timestamp added to vite.config.ts" -ForegroundColor Green
}

# Step 5: Git operations
Write-Host "📝 Committing changes..." -ForegroundColor Yellow
try {
    git add .
    git commit -m "🔧 Force frontend rebuild with API URL debugging - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin main
    Write-Host "✅ Changes pushed to GitHub" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Git operations failed: $_" -ForegroundColor Yellow
    Write-Host "Please manually commit and push the changes" -ForegroundColor Yellow
}

# Step 6: Instructions
Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Monitor GitHub Actions: https://github.com/waltergkaturuza/Parliament-Zimbabwe/actions" -ForegroundColor White
Write-Host "2. Once deployed, check frontend console for debug output" -ForegroundColor White
Write-Host "3. Test login at: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net" -ForegroundColor White
Write-Host "4. If still wrong URL, check Azure Static Web Apps environment configuration" -ForegroundColor White

Write-Host "`n✨ Script completed!" -ForegroundColor Green
