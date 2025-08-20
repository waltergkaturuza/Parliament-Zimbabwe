# Azure Settings Configuration Script (PowerShell)
# This script helps configure Azure to use the correct Django settings module

Write-Host "🔧 AZURE SETTINGS CONFIGURATION" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "Setting DJANGO_SETTINGS_MODULE to use production settings..." -ForegroundColor Blue
Write-Host ""

# Check if Azure CLI is available
try {
    $azVersion = az --version 2>$null
    if ($azVersion) {
        Write-Host "Azure CLI detected. You can run:" -ForegroundColor Green
        Write-Host ""
        Write-Host "az webapp config appsettings set \\" -ForegroundColor Yellow
        Write-Host "  --name YOUR_APP_NAME \\" -ForegroundColor Yellow
        Write-Host "  --resource-group YOUR_RESOURCE_GROUP \\" -ForegroundColor Yellow
        Write-Host "  --settings DJANGO_SETTINGS_MODULE=config.settings.production" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Replace YOUR_APP_NAME and YOUR_RESOURCE_GROUP with your actual values" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Azure CLI not detected or not in PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Or set manually in Azure Portal:" -ForegroundColor Green
Write-Host "1. Go to Azure Portal → App Service → Configuration" -ForegroundColor White
Write-Host "2. In Application Settings, add or modify:" -ForegroundColor White
Write-Host "   Name: DJANGO_SETTINGS_MODULE" -ForegroundColor Yellow
Write-Host "   Value: config.settings.production" -ForegroundColor Yellow
Write-Host "3. Click Save and Restart the app" -ForegroundColor White
Write-Host ""

Write-Host "This will ensure Azure uses:" -ForegroundColor Green
Write-Host "✅ PostgreSQL database (not SQLite)" -ForegroundColor Green
Write-Host "✅ Production CORS settings" -ForegroundColor Green
Write-Host "✅ Proper security configurations" -ForegroundColor Green
Write-Host "✅ Azure-specific environment variables" -ForegroundColor Green

Write-Host ""
Write-Host "After setting this, restart your app service for changes to take effect." -ForegroundColor Cyan

# Optional: Prompt to set the app name and resource group
Write-Host ""
$setNow = Read-Host "Do you want to set this now? (y/n)"
if ($setNow -eq 'y' -or $setNow -eq 'Y') {
    $appName = Read-Host "Enter your Azure App Service name"
    $resourceGroup = Read-Host "Enter your Resource Group name"
    
    if ($appName -and $resourceGroup) {
        Write-Host ""
        Write-Host "Run this command:" -ForegroundColor Yellow
        Write-Host "az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings DJANGO_SETTINGS_MODULE=config.settings.production" -ForegroundColor Cyan
        
        # Copy to clipboard if possible
        try {
            "az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings DJANGO_SETTINGS_MODULE=config.settings.production" | Set-Clipboard
            Write-Host ""
            Write-Host "✅ Command copied to clipboard!" -ForegroundColor Green
        } catch {
            Write-Host ""
            Write-Host "Copy the command above and run it in your terminal" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Configuration script completed!" -ForegroundColor Green
