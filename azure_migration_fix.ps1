# Azure Production Migration Fix Script
# Run this to fix the missing digital_signature column error

Write-Host "🚨 AZURE PRODUCTION MIGRATION FIX" -ForegroundColor Red
Write-Host "Fixing: column fuel_user.digital_signature does not exist" -ForegroundColor Yellow
Write-Host ""

# Check if Azure CLI is installed
try {
    az --version | Out-Null
    Write-Host "✅ Azure CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install Azure CLI first." -ForegroundColor Red
    Write-Host "Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Login check
Write-Host "Checking Azure login status..."
$loginCheck = az account show 2>$null
if (-not $loginCheck) {
    Write-Host "Please login to Azure first:"
    az login
}

Write-Host ""
Write-Host "🔧 Connecting to Azure App Service SSH..."
Write-Host "App Service: parliament-fuel-system"
Write-Host "Resource Group: parliament-fuel-rg"
Write-Host ""

Write-Host "Once connected to SSH, run these commands:"
Write-Host "cd /home/site/wwwroot" -ForegroundColor Cyan
Write-Host "python manage.py migrate fuel" -ForegroundColor Cyan
Write-Host "python manage.py migrate" -ForegroundColor Cyan
Write-Host ""

# Connect to Azure App Service SSH
az webapp ssh --resource-group parliament-fuel-rg --name parliament-fuel-system
