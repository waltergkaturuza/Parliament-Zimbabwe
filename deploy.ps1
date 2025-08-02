# Azure App Service Deployment Script
# Deploy Parliament Fuel System Django Application

Write-Host "🚀 Deploying Parliament Fuel System to Azure App Service" -ForegroundColor Green
Write-Host "=================================================="

# Set variables
$AppName = "parliament-fuel-system-d0bvbjfrdbepdrfh"
$ResourceGroup = "parliament-fuel-rg"
$Runtime = "PYTHON:3.11"

Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow

# Create a zip file of the current directory (excluding some files)
$ExcludeFiles = @(
    "*.git*",
    "node_modules",
    "fuel-coupon-frontend",
    "source",
    "*.pyc",
    "__pycache__",
    "*.log",
    "deploy.ps1",
    "test_health.py",
    "*.ps1"
)

# Set deployment source to local git
Write-Host "🔧 Configuring deployment source..." -ForegroundColor Yellow
az webapp deployment source config-local-git --name $AppName --resource-group $ResourceGroup

Write-Host "🌐 Setting runtime stack to Python 3.11..." -ForegroundColor Yellow
az webapp config set --name $AppName --resource-group $ResourceGroup --linux-fx-version $Runtime

Write-Host "⚙️ Setting startup command..." -ForegroundColor Yellow
az webapp config set --name $AppName --resource-group $ResourceGroup --startup-file "startup.sh"

Write-Host "🔄 Restarting App Service..." -ForegroundColor Yellow
az webapp restart --name $AppName --resource-group $ResourceGroup

Write-Host "✅ Deployment configuration complete!" -ForegroundColor Green
Write-Host "🔍 Testing in 30 seconds..." -ForegroundColor Yellow

Start-Sleep -Seconds 30
python test_health.py
