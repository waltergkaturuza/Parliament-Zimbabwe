# Azure deployment update script
Write-Host "=== Parliament Fuel System - Backend Update ===" -ForegroundColor Green

# Check if we're in the correct directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Yellow

if (-not (Test-Path "manage.py")) {
    Write-Host "ERROR: manage.py not found. Make sure you're in the Django project root." -ForegroundColor Red
    exit 1
}

# Check Azure CLI login
Write-Host "`nChecking Azure CLI login..." -ForegroundColor Cyan
try {
    $account = az account show --query "name" --output tsv 2>$null
    if ($account) {
        Write-Host "✅ Azure CLI logged in as: $account" -ForegroundColor Green
    } else {
        Write-Host "❌ Azure CLI not logged in. Please run 'az login'" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Azure CLI not available or not logged in" -ForegroundColor Red
    exit 1
}

# Configuration
$resourceGroup = "parliament-fuel-rg"
$appName = "parliament-fuel-system"
$backendUrl = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

Write-Host "`nDeployment Configuration:" -ForegroundColor Yellow
Write-Host "Resource Group: $resourceGroup"
Write-Host "App Service: $appName"
Write-Host "Backend URL: $backendUrl"

# Step 1: Update app settings to use stable production settings
Write-Host "`n1. Updating app settings for stable configuration..." -ForegroundColor Cyan
try {
    # Set Django settings to use the stable production configuration
    az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings "DJANGO_SETTINGS_MODULE=config.settings.production_stable" --output none
    
    # Ensure DEBUG is disabled
    az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings "DEBUG=False" --output none
    
    # Set CORS debug mode off for stability
    az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings "DEBUG_PRODUCTION_ISSUES=False" --output none
    
    Write-Host "✅ App settings updated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to update app settings: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Deploy the code
Write-Host "`n2. Deploying updated code..." -ForegroundColor Cyan
try {
    # Create a deployment package (excluding unnecessary files)
    Write-Host "Creating deployment package..." -ForegroundColor Yellow
    
    # Use az webapp deploy for direct deployment
    az webapp deploy --name $appName --resource-group $resourceGroup --src-path . --type zip --async false
    
    Write-Host "✅ Code deployment initiated" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy code: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Restart the app service
Write-Host "`n3. Restarting App Service..." -ForegroundColor Cyan
try {
    az webapp restart --name $appName --resource-group $resourceGroup --output none
    Write-Host "✅ App Service restarted" -ForegroundColor Green
    
    # Wait a moment for restart
    Start-Sleep -Seconds 30
} catch {
    Write-Host "❌ Failed to restart app service: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test the backend
Write-Host "`n4. Testing backend connectivity..." -ForegroundColor Cyan

# Test basic connectivity
try {
    Write-Host "Testing root endpoint..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $backendUrl -Method GET -UseBasicParsing -TimeoutSec 30
    Write-Host "✅ Root endpoint: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Root endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Test health endpoint
try {
    Write-Host "Testing health endpoint..." -ForegroundColor Yellow
    $healthUrl = "$backendUrl/api/health/"
    $response = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Health endpoint: Status $($response.StatusCode)" -ForegroundColor Green
    
    # Try to parse the response
    $healthData = $response.Content | ConvertFrom-Json
    Write-Host "   Database: $($healthData.database)" -ForegroundColor White
    Write-Host "   Debug: $($healthData.debug)" -ForegroundColor White
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test login endpoint
try {
    Write-Host "Testing login endpoint..." -ForegroundColor Yellow
    $loginUrl = "$backendUrl/api/auth/login/"
    $response = Invoke-WebRequest -Uri $loginUrl -Method GET -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Login endpoint: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Login endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Step 5: Get application logs
Write-Host "`n5. Getting recent application logs..." -ForegroundColor Cyan
try {
    Write-Host "Fetching app service logs..." -ForegroundColor Yellow
    az webapp log tail --name $appName --resource-group $resourceGroup --provider application --timeout 10
} catch {
    Write-Host "Could not fetch logs directly. Checking log stream..." -ForegroundColor Yellow
    try {
        az webapp log config --name $appName --resource-group $resourceGroup --application-logging true --detailed-error-messages true --failed-request-tracing true --web-server-logging filesystem
        Write-Host "✅ Logging enabled. Use 'az webapp log tail' to view logs." -ForegroundColor Green
    } catch {
        Write-Host "❌ Could not configure logging" -ForegroundColor Red
    }
}

Write-Host "`n=== Deployment Update Complete ===" -ForegroundColor Green
Write-Host "Backend URL: $backendUrl" -ForegroundColor Yellow
Write-Host "Admin URL: $backendUrl/admin/" -ForegroundColor Yellow
Write-Host "Health Check: $backendUrl/api/health/" -ForegroundColor Yellow
