# Azure App Service Diagnostics Script
Write-Host "=== Azure App Service Diagnostics ===" -ForegroundColor Green

# Check Azure CLI version
Write-Host "`nChecking Azure CLI..." -ForegroundColor Cyan
try {
    $azVersion = az --version 2>$null
    Write-Host "✅ Azure CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not available: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get App Service details
Write-Host "`nGetting App Service details..." -ForegroundColor Cyan
$appName = "parliament-fuel-system"
$resourceGroup = "parliament-fuel-rg"

try {
    Write-Host "App Service Status:" -ForegroundColor Yellow
    az webapp show --name $appName --resource-group $resourceGroup --query "{name:name, state:state, availabilityState:availabilityState, defaultHostName:defaultHostName, httpsOnly:httpsOnly}" --output table
    
    Write-Host "`nApp Service Configuration:" -ForegroundColor Yellow
    az webapp config show --name $appName --resource-group $resourceGroup --query "{pythonVersion:pythonVersion, linuxFxVersion:linuxFxVersion, alwaysOn:alwaysOn}" --output table
    
    Write-Host "`nApp Settings (filtered for sensitive data):" -ForegroundColor Yellow
    az webapp config appsettings list --name $appName --resource-group $resourceGroup --query "[?!contains(name, 'SECRET') && !contains(name, 'PASSWORD') && !contains(name, 'KEY')].{name:name, value:value}" --output table
    
} catch {
    Write-Host "❌ Failed to get App Service details: $($_.Exception.Message)" -ForegroundColor Red
}

# Test basic connectivity
Write-Host "`nTesting connectivity..." -ForegroundColor Cyan
$backendUrl = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

try {
    $response = Invoke-WebRequest -Uri $backendUrl -Method HEAD -UseBasicParsing -TimeoutSec 30
    Write-Host "✅ Backend is responding - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend connectivity failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n=== Diagnostics Complete ===" -ForegroundColor Green
