# Simple Frontend API Fix Script
Write-Host "Starting Frontend API Fix..." -ForegroundColor Green

# Create debug file
$debugContent = @"
console.log('=== ENV DEBUG ===');
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
console.log('All env:', import.meta.env);
"@

Write-Host "Creating debug file..." -ForegroundColor Yellow
Set-Content -Path "fuel-coupon-frontend/debug-env.js" -Value $debugContent

# Update vite config to force rebuild
Write-Host "Updating vite config..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
Add-Content -Path "fuel-coupon-frontend/vite.config.ts" -Value "// Rebuild: $timestamp"

# Git operations
Write-Host "Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Force frontend rebuild with debug - $timestamp"
git push origin main

Write-Host "Done! Check GitHub Actions for deployment status." -ForegroundColor Green
Write-Host "Frontend: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net" -ForegroundColor Cyan
Write-Host "Actions: https://github.com/waltergkaturuza/Parliament-Zimbabwe/actions" -ForegroundColor Cyan
