# Critical deployment fix script
Write-Host "=== Critical Backend Fix Deployment ===" -ForegroundColor Red

$resourceGroup = "parliament-fuel-rg"
$appName = "parliament-fuel-system"

# Step 1: Update app settings to use stable production configuration
Write-Host "`n1. Updating Django settings module..." -ForegroundColor Yellow
try {
    az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings "DJANGO_SETTINGS_MODULE=config.settings.production_stable" --output none
    Write-Host "✅ Django settings updated to production_stable" -ForegroundColor Green
    
    # Disable debug mode
    az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings "DEBUG=False" --output none
    Write-Host "✅ DEBUG disabled" -ForegroundColor Green
    
    # Disable problematic debug settings
    az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings "DEBUG_PRODUCTION_ISSUES=False" --output none
    Write-Host "✅ Debug production issues disabled" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to update app settings: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Restart the app
Write-Host "`n2. Restarting App Service..." -ForegroundColor Yellow
try {
    az webapp restart --name $appName --resource-group $resourceGroup --output none
    Write-Host "✅ App Service restarted" -ForegroundColor Green
    
    # Wait for restart
    Write-Host "Waiting 30 seconds for restart..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
} catch {
    Write-Host "❌ Failed to restart: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Test the backend
Write-Host "`n3. Testing backend..." -ForegroundColor Yellow
$backendUrl = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

# Test basic connectivity
for ($i = 1; $i -le 3; $i++) {
    Write-Host "Attempt $i..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $backendUrl -Method GET -UseBasicParsing -TimeoutSec 30
        Write-Host "✅ SUCCESS: Backend responding with status $($response.StatusCode)" -ForegroundColor Green
        
        # Try to parse response
        try {
            $data = $response.Content | ConvertFrom-Json
            Write-Host "   Message: $($data.message)" -ForegroundColor White
            Write-Host "   Version: $($data.version)" -ForegroundColor White
        } catch {
            Write-Host "   Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))" -ForegroundColor White
        }
        break
    } catch {
        Write-Host "❌ Attempt $i failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($i -lt 3) {
            Start-Sleep -Seconds 10
        }
    }
}

Write-Host "`n=== Fix deployment completed ===" -ForegroundColor Green
