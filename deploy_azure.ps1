# 🏛️ Parliament Fuel Coupon System - Azure Deployment Script (PowerShell)
# This script creates all Azure resources for production deployment

param(
    [string]$SubscriptionId,
    [string]$ResourceGroup = "rg-parliament-fuel-system-prod",
    [string]$Location = "South Africa North"
)

$ErrorActionPreference = "Stop"

# Configuration
$AppServicePlan = "asp-parliament-fuel-prod"
$WebAppName = "app-parliament-fuel-prod"
$DbServerName = "psql-parliament-fuel-prod"
$KeyVaultName = "kv-parliament-fuel-prod"
$StorageAccount = "stparliamentfuelprod"

# Database configuration
$DbAdminUser = "parliament_admin"
$DbAdminPassword = "ParliamentDB2025!@#"
$DbName = "fuel_coupon_system"

Write-Host "🏛️ Starting Azure deployment for Parliament Fuel Coupon System..." -ForegroundColor Green

# Login and set subscription
if ($SubscriptionId) {
    Write-Host "🔐 Setting Azure subscription..." -ForegroundColor Yellow
    az account set --subscription $SubscriptionId
}

# 1. Create Resource Group
Write-Host "📁 Creating resource group..." -ForegroundColor Yellow
az group create `
    --name $ResourceGroup `
    --location $Location `
    --tags Environment=Production Department=Parliament System=FuelCouponSystem

# 2. Create PostgreSQL Database
Write-Host "🗄️ Creating PostgreSQL database..." -ForegroundColor Yellow
az postgres flexible-server create `
    --resource-group $ResourceGroup `
    --name $DbServerName `
    --admin-user $DbAdminUser `
    --admin-password $DbAdminPassword `
    --sku-name Standard_B2s `
    --tier Burstable `
    --storage-size 128 `
    --version 14 `
    --location $Location `
    --yes

# Configure database firewall
Write-Host "🔧 Configuring database firewall..." -ForegroundColor Yellow
az postgres flexible-server firewall-rule create `
    --resource-group $ResourceGroup `
    --name $DbServerName `
    --rule-name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0

# Create application database
Write-Host "📊 Creating application database..." -ForegroundColor Yellow
az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $DbServerName `
    --database-name $DbName

# 3. Create App Service Plan
Write-Host "🌐 Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
    --name $AppServicePlan `
    --resource-group $ResourceGroup `
    --sku P1V3 `
    --is-linux `
    --location $Location

# 4. Create Web App
Write-Host "🚀 Creating Web App..." -ForegroundColor Yellow
az webapp create `
    --resource-group $ResourceGroup `
    --plan $AppServicePlan `
    --name $WebAppName `
    --runtime "PYTHON|3.11" `
    --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 config.wsgi"

# 5. Create Key Vault
Write-Host "🔐 Creating Key Vault..." -ForegroundColor Yellow
az keyvault create `
    --name $KeyVaultName `
    --resource-group $ResourceGroup `
    --location $Location `
    --enable-soft-delete `
    --enable-purge-protection

# 6. Create Storage Account
Write-Host "💾 Creating Storage Account..." -ForegroundColor Yellow
az storage account create `
    --name $StorageAccount `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Standard_LRS `
    --kind StorageV2

# Create storage containers
Write-Host "📦 Creating storage containers..." -ForegroundColor Yellow
az storage container create `
    --name static `
    --account-name $StorageAccount `
    --public-access blob

az storage container create `
    --name media `
    --account-name $StorageAccount `
    --public-access blob

# 7. Configure Web App Settings
Write-Host "⚙️ Configuring Web App settings..." -ForegroundColor Yellow

# Get storage account key
$StorageKey = az storage account keys list `
    --resource-group $ResourceGroup `
    --account-name $StorageAccount `
    --query '[0].value' `
    --output tsv

# Set application settings
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $WebAppName `
    --settings `
        DJANGO_SETTINGS_MODULE=config.settings.production `
        "DB_HOST=$DbServerName.postgres.database.azure.com" `
        DB_NAME=$DbName `
        DB_USER=$DbAdminUser `
        DB_PASSWORD=$DbAdminPassword `
        DB_PORT=5432 `
        AZURE_STORAGE_ACCOUNT_NAME=$StorageAccount `
        AZURE_STORAGE_ACCOUNT_KEY=$StorageKey `
        AZURE_STORAGE_CONTAINER=static `
        WEBSITE_HTTPLOGGING_RETENTION_DAYS=7 `
        SCM_DO_BUILD_DURING_DEPLOYMENT=true `
        ENABLE_ORYX_BUILD=true `
        'PRE_BUILD_COMMAND=python -m pip install --upgrade pip' `
        'POST_BUILD_COMMAND=python manage.py collectstatic --noinput && python manage.py migrate'

# 8. Enable HTTPS
Write-Host "🔒 Configuring HTTPS..." -ForegroundColor Yellow
az webapp update `
    --resource-group $ResourceGroup `
    --name $WebAppName `
    --https-only true

# 9. Create Application Insights
Write-Host "📊 Creating Application Insights..." -ForegroundColor Yellow
az monitor app-insights component create `
    --app $WebAppName `
    --location $Location `
    --resource-group $ResourceGroup `
    --kind web

# Get Application Insights instrumentation key
$AppInsightsKey = az monitor app-insights component show `
    --app $WebAppName `
    --resource-group $ResourceGroup `
    --query instrumentationKey `
    --output tsv

# Add Application Insights to app settings
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $WebAppName `
    --settings APPINSIGHTS_INSTRUMENTATIONKEY=$AppInsightsKey

Write-Host "✅ Azure resources created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "======================"
Write-Host "🌐 Web App URL: https://$WebAppName.azurewebsites.net"
Write-Host "🗄️ Database Server: $DbServerName.postgres.database.azure.com"
Write-Host "🔐 Key Vault: $KeyVaultName"
Write-Host "💾 Storage Account: $StorageAccount"
Write-Host ""
Write-Host "🔑 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Store secrets in Key Vault"
Write-Host "2. Configure custom domain (fuel.parliament.gov.zw)"
Write-Host "3. Deploy application code"
Write-Host "4. Run database migrations"
Write-Host "5. Create admin users"
Write-Host ""
Write-Host "🚀 Ready for application deployment!" -ForegroundColor Green

# Output connection information to file
$ConnectionInfo = @"
# 🏛️ Parliament Fuel Coupon System - Azure Connection Info

## Database Connection
Host: $DbServerName.postgres.database.azure.com
Database: $DbName
Username: $DbAdminUser
Password: $DbAdminPassword
Port: 5432

## Web App
URL: https://$WebAppName.azurewebsites.net
Resource Group: $ResourceGroup

## Storage Account
Name: $StorageAccount
Key: $StorageKey

## Application Insights
Key: $AppInsightsKey

## Key Vault
Name: $KeyVaultName
"@

$ConnectionInfo | Out-File -FilePath "azure_connection_info.txt" -Encoding UTF8
Write-Host "📄 Connection information saved to azure_connection_info.txt" -ForegroundColor Green
