# Fix CORS Issue - Azure App Service Configuration
Write-Host "🔧 Fixing CORS Issue - Azure App Service Configuration" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Update App Service settings to fix CORS
Write-Host "Updating Azure App Service settings..." -ForegroundColor Yellow

az webapp config appsettings set `
  --resource-group parliament-fuel-rg `
  --name parliament-fuel-system `
  --settings `
    "DJANGO_DEBUG=False" `
    "DJANGO_ALLOWED_HOSTS=parliament-fuel-system.azurewebsites.net,parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net" `
    "CORS_ALLOWED_ORIGINS=https://jolly-ocean-0e0dee90f.2.azurestaticapps.net,https://parliament-fuel-system.azurewebsites.net" `
    "CORS_ALLOW_CREDENTIALS=True" `
    "CORS_ALLOW_ALL_ORIGINS=False"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ CORS settings updated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update CORS settings" -ForegroundColor Red
    exit 1
}

# Restart the app service
Write-Host "Restarting App Service..." -ForegroundColor Yellow

az webapp restart `
  --resource-group parliament-fuel-rg `
  --name parliament-fuel-system

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App Service restarted successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to restart App Service" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 Configuration Updated:" -ForegroundColor Green
Write-Host "   Frontend URL: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net" -ForegroundColor White
Write-Host "   Backend URL:  https://parliament-fuel-system.azurewebsites.net" -ForegroundColor White
Write-Host ""
Write-Host "✅ CORS issue should now be resolved!" -ForegroundColor Green
Write-Host ""

# Test the connection
Write-Host "Testing backend health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://parliament-fuel-system.azurewebsites.net/api/health/" -Method GET
    Write-Host "✅ Backend is responding: $($response)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   This might be normal if the health endpoint doesn't exist yet" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Push your GitHub changes to trigger frontend rebuild" -ForegroundColor White
Write-Host "2. Test the login functionality" -ForegroundColor White
Write-Host "3. Monitor the browser console for any remaining errors" -ForegroundColor White
