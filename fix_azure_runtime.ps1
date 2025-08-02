# PowerShell script to redeploy Django app to Azure App Service with correct Python runtime

Write-Host "Redeploying Parliament Fuel System to Azure with Python Runtime" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Set variables
$resourceGroup = "parliament-fuel-rg"
$appName = "parliament-fuel-system-d0bvbjfrdbepdrfh"
$location = "South Africa North"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "   Resource Group: $resourceGroup"
Write-Host "   App Name: $appName"
Write-Host "   Location: $location"

# Step 1: Configure Python runtime
Write-Host "`nSetting Python 3.11 runtime..." -ForegroundColor Cyan
az webapp config set `
    --name $appName `
    --resource-group $resourceGroup `
    --linux-fx-version "PYTHON|3.11"

# Step 2: Set startup command
Write-Host "Setting startup command..." -ForegroundColor Cyan
az webapp config set `
    --name $appName `
    --resource-group $resourceGroup `
    --startup-file "startup.sh"

# Step 3: Configure application settings
Write-Host "Setting application settings..." -ForegroundColor Cyan
az webapp config appsettings set `
    --name $appName `
    --resource-group $resourceGroup `
    --settings `
        DJANGO_SETTINGS_MODULE="config.settings.production" `
        PYTHONPATH="/home/site/wwwroot" `
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" `
        WEBSITE_RUN_FROM_PACKAGE="0"

# Step 4: Restart the app
Write-Host "`nRestarting App Service..." -ForegroundColor Cyan
az webapp restart --name $appName --resource-group $resourceGroup

Write-Host "`nConfiguration updated!" -ForegroundColor Green
Write-Host "App URL: https://$appName.azurewebsites.net" -ForegroundColor Green

# Step 5: Test the deployment
Write-Host "`nTesting deployment in 30 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host "Running health check..." -ForegroundColor Cyan
python test_health.py

Write-Host "`nRedeployment process completed!" -ForegroundColor Green
