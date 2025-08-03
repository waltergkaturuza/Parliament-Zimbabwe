# Azure App Service Deployment Script for Windows PowerShell
# Run this script in PowerShell with Azure CLI installed

param(
    [string]$ResourceGroup = "parliament-fuel-rg",
    [string]$AppServicePlan = "parliament-fuel-plan",
    [string]$WebAppName = "parliament-fuel-system",
    [string]$Location = "South Africa North",
    [string]$PythonVersion = "3.11"
)

Write-Host "Deploying Parliament Fuel System to Azure App Service..." -ForegroundColor Green

# Login to Azure (if not already logged in)
# az login

# Create resource group (if it doesn't exist)
Write-Host "Creating resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location

# Create App Service Plan
Write-Host "Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
    --name $AppServicePlan `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku B1 `
    --is-linux

# Create Web App
Write-Host "Creating Web App..." -ForegroundColor Yellow
az webapp create `
    --name $WebAppName `
    --resource-group $ResourceGroup `
    --plan $AppServicePlan `
    --runtime "PYTHON|$PythonVersion"

# Configure environment variables
Write-Host "Configuring environment variables..." -ForegroundColor Yellow
az webapp config appsettings set `
    --name $WebAppName `
    --resource-group $ResourceGroup `
    --settings `
        DJANGO_DEBUG="False" `
        DJANGO_SECRET_KEY="parliament-fuel-secret-key-2024-production-environment-secure" `
        AZURE_HOSTNAME="$WebAppName.azurewebsites.net" `
        FRONTEND_HOSTNAME="parliament-fuel-system.azurewebsites.net" `
        DJANGO_ALLOWED_HOSTS="$WebAppName.azurewebsites.net,parliament-fuel-system.azurewebsites.net" `
        CORS_ALLOWED_ORIGINS="https://parliament-fuel-system.azurewebsites.net" `
        SECURE_SSL_REDIRECT="True" `
        SESSION_COOKIE_SECURE="True" `
        CSRF_COOKIE_SECURE="True" `
        WEBSITE_HOSTNAME="$WebAppName.azurewebsites.net"

# Configure startup command
Write-Host "Configuring startup command..." -ForegroundColor Yellow
az webapp config set `
    --name $WebAppName `
    --resource-group $ResourceGroup `
    --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 config.wsgi"

# Enable logging
Write-Host "Enabling logging..." -ForegroundColor Yellow
az webapp log config `
    --name $WebAppName `
    --resource-group $ResourceGroup `
    --application-logging filesystem `
    --level information

# Configure Git deployment (optional)
Write-Host "Configuring Git deployment..." -ForegroundColor Yellow
az webapp deployment source config-local-git `
    --name $WebAppName `
    --resource-group $ResourceGroup

Write-Host "Azure App Service created successfully!" -ForegroundColor Green
Write-Host "Web App URL: https://$WebAppName.azurewebsites.net" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure your PostgreSQL database connection"
Write-Host "2. Deploy your code using Git:"
Write-Host "   git remote add azure https://$WebAppName.scm.azurewebsites.net:443/$WebAppName.git"
Write-Host "   git push azure main"
Write-Host "3. Run database migrations"
Write-Host "4. Test the application endpoints"
