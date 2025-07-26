# Azure App Service Environment Variables Configuration Script
# Run this in PowerShell with Azure CLI installed

Write-Host "🚀 CONFIGURING AZURE APP SERVICE ENVIRONMENT VARIABLES" -ForegroundColor Green
Write-Host "=" * 60

# App Service Configuration
$resourceGroup = "parliament-fuel-postgres"
$appName = "parliament-fuel-system"

Write-Host "📍 Target Configuration:" -ForegroundColor Yellow
Write-Host "   Resource Group: $resourceGroup"
Write-Host "   App Service: $appName"
Write-Host ""

# Check if Azure CLI is logged in
Write-Host "🔍 Checking Azure CLI login status..." -ForegroundColor Cyan
try {
    $account = az account show --query "name" -o tsv 2>$null
    if ($account) {
        Write-Host "✅ Logged in to Azure as: $account" -ForegroundColor Green
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Host "❌ Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Setting Database Configuration..." -ForegroundColor Cyan

# Database Configuration
$dbSettings = @{
    "DB_HOST" = "parliament-fuel-postgres.postgres.database.azure.com"
    "DB_NAME" = "parliament-fuel-db"  
    "DB_USER" = "yekrzopkqr"
    "DB_PASSWORD" = "Un0vT5psBUBTSQdA"
    "DB_PORT" = "5432"
}

foreach ($setting in $dbSettings.GetEnumerator()) {
    Write-Host "   Setting $($setting.Key)..." -ForegroundColor White
    az webapp config appsettings set --resource-group $resourceGroup --name $appName --settings "$($setting.Key)=$($setting.Value)" --output none
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $($setting.Key) configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to set $($setting.Key)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🐍 Setting Django Configuration..." -ForegroundColor Cyan

# Generate a secure secret key
$secretKey = "parliament-fuel-secret-$(Get-Random)-$(Get-Date -Format 'yyyyMMddHHmmss')"

$djangoSettings = @{
    "DJANGO_SECRET_KEY" = $secretKey
    "DJANGO_DEBUG" = "False"
    "DJANGO_SETTINGS_MODULE" = "config.settings.production"
    "DJANGO_ALLOWED_HOSTS" = "parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net,parliament-fuel-system.azurewebsites.net,*.azurewebsites.net"
}

foreach ($setting in $djangoSettings.GetEnumerator()) {
    Write-Host "   Setting $($setting.Key)..." -ForegroundColor White
    az webapp config appsettings set --resource-group $resourceGroup --name $appName --settings "$($setting.Key)=$($setting.Value)" --output none
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $($setting.Key) configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to set $($setting.Key)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔧 Setting Python Configuration..." -ForegroundColor Cyan

$pythonSettings = @{
    "PYTHONPATH" = "/home/site/wwwroot"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
    "WEBSITE_WEBDEPLOY_USE_SCM" = "true"
    "WEBSITE_RUN_FROM_PACKAGE" = "1"
}

foreach ($setting in $pythonSettings.GetEnumerator()) {
    Write-Host "   Setting $($setting.Key)..." -ForegroundColor White
    az webapp config appsettings set --resource-group $resourceGroup --name $appName --settings "$($setting.Key)=$($setting.Value)" --output none
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $($setting.Key) configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to set $($setting.Key)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "💼 Setting Business Central Configuration..." -ForegroundColor Cyan

$bcSettings = @{
    "BC_TENANT_ID" = "086c4475-d0ef-4d2b-871c-4e078a083db5"
    "BC_CLIENT_ID" = "c26c60eb-f154-40eb-b02e-f3997e083316"
    "BC_CLIENT_SECRET" = "us18Q~TnKoQ5hYlKNtIAweLGoTdqX7kSdvFTIcI1"
    "BC_ENVIRONMENT" = "Production"
}

foreach ($setting in $bcSettings.GetEnumerator()) {
    Write-Host "   Setting $($setting.Key)..." -ForegroundColor White
    az webapp config appsettings set --resource-group $resourceGroup --name $appName --settings "$($setting.Key)=$($setting.Value)" --output none
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $($setting.Key) configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to set $($setting.Key)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔄 Restarting App Service..." -ForegroundColor Cyan
az webapp restart --resource-group $resourceGroup --name $appName --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App Service restarted successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to restart App Service" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "⏳ Wait 2-3 minutes for the application to start up properly."
Write-Host ""
Write-Host "🌐 Test URLs:" -ForegroundColor Yellow
Write-Host "   Backend: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/"
Write-Host "   API: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/v1/"
Write-Host "   Admin: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/admin/"
Write-Host ""
Write-Host "📊 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 2-3 minutes for restart to complete"
Write-Host "   2. Test the backend endpoints"
Write-Host "   3. Run database migrations if needed"
Write-Host "   4. Test frontend-backend connection"
