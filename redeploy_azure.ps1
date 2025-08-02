# PowerShell script to redeploy Django app to Azure App Service with correct Python runtime

Write-Host "Redeploying Parliament Fuel System to Azure with Python Runtime" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Set variables
$resourceGroup = "parliament-fuel-rg"
$appName = "parliament-fuel-system-d0bvbjfrdbepdrfh"
$location = "South Africa North"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Resource Group: $resourceGroup"
Write-Host "   App Name: $appName"
Write-Host "   Location: $location"

# Step 1: Check if app exists
Write-Host "`n🔍 Checking if App Service exists..." -ForegroundColor Cyan
try {
    $app = az webapp show --name $appName --resource-group $resourceGroup 2>$null | ConvertFrom-Json
    if ($app) {
        Write-Host "✅ App Service found" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ App Service not found. Creating new one..." -ForegroundColor Red
    
    # Create App Service Plan
    Write-Host "📦 Creating App Service Plan..." -ForegroundColor Cyan
    az appservice plan create `
        --name "$appName-plan" `
        --resource-group $resourceGroup `
        --location $location `
        --is-linux `
        --sku B1
    
    # Create Web App
    Write-Host "🌐 Creating Web App..." -ForegroundColor Cyan
    az webapp create `
        --name $appName `
        --resource-group $resourceGroup `
        --plan "$appName-plan" `
        --runtime "PYTHON:3.11"
}

# Step 2: Configure Python runtime
Write-Host "`n🐍 Setting Python 3.11 runtime..." -ForegroundColor Cyan
az webapp config set `
    --name $appName `
    --resource-group $resourceGroup `
    --linux-fx-version "PYTHON|3.11"

# Step 3: Set startup command
Write-Host "⚙️ Setting startup command..." -ForegroundColor Cyan
az webapp config set `
    --name $appName `
    --resource-group $resourceGroup `
    --startup-file "startup.sh"

# Step 4: Configure application settings
Write-Host "🔧 Setting application settings..." -ForegroundColor Cyan
az webapp config appsettings set `
    --name $appName `
    --resource-group $resourceGroup `
    --settings `
        DJANGO_SETTINGS_MODULE="config.settings.production" `
        PYTHONPATH="/home/site/wwwroot" `
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" `
        WEBSITE_RUN_FROM_PACKAGE="0"

# Step 5: Deploy from local Git
Write-Host "`n📡 Setting up deployment from Git..." -ForegroundColor Cyan

# Check if git remote exists
$remoteExists = git remote get-url azure 2>$null
if (-not $remoteExists) {
    Write-Host "🔗 Adding Azure remote..." -ForegroundColor Cyan
    $deploymentUrl = az webapp deployment source config-local-git `
        --name $appName `
        --resource-group $resourceGroup `
        --query url `
        --output tsv
    
    git remote add azure $deploymentUrl
} else {
    Write-Host "✅ Azure remote already exists" -ForegroundColor Green
}

# Step 6: Deploy the application
Write-Host "`n🚀 Deploying application..." -ForegroundColor Cyan
Write-Host "⚠️ You may be prompted for deployment credentials" -ForegroundColor Yellow

# Ensure all files are committed
git add .
git commit -m "Deploy with Python runtime configuration - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Push to Azure
git push azure main

# Step 7: Restart the app
Write-Host "`n🔄 Restarting App Service..." -ForegroundColor Cyan
az webapp restart --name $appName --resource-group $resourceGroup

Write-Host "`n✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 App URL: https://$appName.azurewebsites.net" -ForegroundColor Green
Write-Host "📊 You can monitor logs with: az webapp log tail --name $appName --resource-group $resourceGroup" -ForegroundColor Yellow

# Step 8: Test the deployment
Write-Host "`n🧪 Testing deployment in 30 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host "Running health check..." -ForegroundColor Cyan
python test_health.py

Write-Host "`nRedeployment process completed!" -ForegroundColor Green
