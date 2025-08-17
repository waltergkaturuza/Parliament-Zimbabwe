# Azure App Service Deployment Script - PowerShell
# Parliament Fuel System - Direct Deployment

Write-Host "🚀 Parliament Fuel System - Azure Deployment" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Azure resource details from production.py
$APP_NAME = "parliament-fuel-system"
$LOCATION = "southafricanorth"

# From production.py settings
$ACTUAL_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   App Name: $APP_NAME"
Write-Host "   URL: $ACTUAL_URL"
Write-Host "   Location: $LOCATION"
Write-Host ""

# 1. Check Azure CLI login
Write-Host "🔐 Checking Azure CLI authentication..." -ForegroundColor Blue
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Not logged into Azure CLI" -ForegroundColor Red
    Write-Host "Please run: az login"
    exit 1
}

# 2. List existing web apps to find our app
Write-Host "🔍 Finding existing web apps..." -ForegroundColor Blue
$webapps = az webapp list --output json | ConvertFrom-Json

Write-Host "Available web apps:" -ForegroundColor Yellow
foreach ($app in $webapps) {
    Write-Host "   - $($app.name) (Resource Group: $($app.resourceGroup))"
}

# 3. Get the correct resource group for our app
Write-Host "🔍 Finding resource group for app..." -ForegroundColor Blue
$targetApp = $webapps | Where-Object { $_.name -eq $APP_NAME }

if (-not $targetApp) {
    Write-Host "❌ App $APP_NAME not found." -ForegroundColor Red
    exit 1
}

$RESOURCE_GROUP = $targetApp.resourceGroup
Write-Host "✅ Found app '$APP_NAME' in resource group '$RESOURCE_GROUP'" -ForegroundColor Green

# 4. Show current app status
Write-Host "📊 Current app status:" -ForegroundColor Blue
az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "{name:name, state:state, hostNames:hostNames}" --output table

# 5. Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Blue
pip freeze > requirements.txt

# 6. Deploy using az webapp up
Write-Host "🚀 Deploying application..." -ForegroundColor Blue
az webapp up --name $APP_NAME --resource-group $RESOURCE_GROUP

# 7. Configure app settings
Write-Host "⚙️ Configuring app settings..." -ForegroundColor Blue
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --settings `
    DJANGO_SETTINGS_MODULE="config.settings.production" `
    PYTHONPATH="/home/site/wwwroot" `
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" `
    WEBSITE_RUN_FROM_PACKAGE="0"

# 8. Set startup command
Write-Host "🔧 Setting startup command..." -ForegroundColor Blue
az webapp config set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --startup-file "startup.sh"

# 9. Restart the app
Write-Host "🔄 Restarting application..." -ForegroundColor Blue
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# 10. Wait for restart
Write-Host "⏳ Waiting for restart to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 11. Test the deployment
Write-Host "🧪 Testing deployment..." -ForegroundColor Blue
try {
    $healthResponse = Invoke-WebRequest -Uri "$ACTUAL_URL/health/" -TimeoutSec 30
    Write-Host "✅ Health check: $($healthResponse.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
    $homeResponse = Invoke-WebRequest -Uri "$ACTUAL_URL/" -TimeoutSec 30
    Write-Host "✅ Home page: $($homeResponse.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Home page failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Application URL: $ACTUAL_URL" -ForegroundColor Cyan
Write-Host "📊 Admin Panel: $ACTUAL_URL/admin/" -ForegroundColor Cyan
Write-Host "📋 API Docs: $ACTUAL_URL/api/schema/swagger-ui/" -ForegroundColor Cyan
Write-Host ""
Write-Host "To monitor logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP" -ForegroundColor Yellow
