# Simple Azure Production Deployment Script
Write-Host "🚀 Starting Azure Production Deployment..." -ForegroundColor Green

# Check if Azure CLI is available
$azExists = Get-Command "az" -ErrorAction SilentlyContinue
if (-not $azExists) {
    Write-Host "❌ Azure CLI not installed. Please install Azure CLI first." -ForegroundColor Red
    exit 1
}

# Set variables
$RESOURCE_GROUP = "fuel-system-rg"
$APP_NAME = "parliament-fuel-system"
$WEBAPP_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

Write-Host "📦 Resource Group: $RESOURCE_GROUP" -ForegroundColor Cyan
Write-Host "🌐 App Name: $APP_NAME" -ForegroundColor Cyan
Write-Host "🔗 URL: $WEBAPP_URL" -ForegroundColor Cyan

Write-Host "🔄 Triggering Azure deployment from GitHub..." -ForegroundColor Yellow
az webapp deployment source sync --resource-group $RESOURCE_GROUP --name $APP_NAME

Write-Host "⏳ Checking deployment status..." -ForegroundColor Yellow
az webapp deployment list --resource-group $RESOURCE_GROUP --name $APP_NAME --query "[0].{Status:status, Message:message, Time:end_time}" --output table

Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep 30

Write-Host "🎉 Deployment triggered! Check Azure portal for status." -ForegroundColor Green
Write-Host "🌐 Production URL: $WEBAPP_URL" -ForegroundColor Cyan
