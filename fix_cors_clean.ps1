# PowerShell script to fix CORS configuration for Parliament Fuel System
# This script configures Azure App Service to allow cross-origin requests from the frontend

Write-Host "🔧 Fixing CORS configuration for Parliament Fuel System..." -ForegroundColor Cyan
Write-Host ""

# Variables
$resourceGroup = "parliament-fuel-system"
$appName = "parliament-fuel-system"
$frontendUrl = "https://jolly-ocean-0e0dee90f.1.azurestaticapps.net"

# Check if user is logged into Azure
Write-Host "📋 Checking Azure CLI login status..." -ForegroundColor Blue
try {
    $account = az account show --query "user.name" -o tsv 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Logged in as: $account" -ForegroundColor Green
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Host "❌ Not logged in to Azure CLI" -ForegroundColor Red
    Write-Host "Please run: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🌐 Configuring CORS settings..." -ForegroundColor Blue

# Update CORS_ALLOWED_ORIGINS environment variable
Write-Host "Setting CORS_ALLOWED_ORIGINS..." -ForegroundColor Yellow
az webapp config appsettings set --resource-group $resourceGroup --name $appName --settings CORS_ALLOWED_ORIGINS="$frontendUrl,https://localhost:3000,https://127.0.0.1:3000"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ CORS_ALLOWED_ORIGINS updated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update CORS_ALLOWED_ORIGINS" -ForegroundColor Red
    exit 1
}

# Configure CORS directly in App Service
Write-Host "Configuring App Service CORS..." -ForegroundColor Yellow
az webapp cors add --resource-group $resourceGroup --name $appName --allowed-origins $frontendUrl "https://localhost:3000" "https://127.0.0.1:3000"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App Service CORS configured successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  App Service CORS might already be configured" -ForegroundColor Yellow
}

# Restart the app service to apply changes
Write-Host ""
Write-Host "🔄 Restarting App Service to apply changes..." -ForegroundColor Blue
az webapp restart --resource-group $resourceGroup --name $appName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App Service restarted successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to restart App Service" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧪 Testing backend connectivity..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "https://parliament-fuel-system.azurewebsites.net/api/health/" -Method GET
    Write-Host "✅ Backend is responding: $response" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   This might be normal if the health endpoint does not exist yet" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ CORS configuration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. GitHub Actions should rebuild the frontend with the corrected backend URL" -ForegroundColor White
Write-Host "2. Test the login functionality once deployment completes" -ForegroundColor White
Write-Host "3. Check Azure Static Web Apps for deployment status" -ForegroundColor White
