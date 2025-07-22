#!/bin/bash

# 🏛️ Parliament Fuel Coupon System - Azure Deployment Script
# This script creates all Azure resources for production deployment

set -e  # Exit on any error

# Configuration
RESOURCE_GROUP="rg-parliament-fuel-system-prod"
LOCATION="South Africa North"
APP_SERVICE_PLAN="asp-parliament-fuel-prod"
WEB_APP_NAME="app-parliament-fuel-prod"
DB_SERVER_NAME="psql-parliament-fuel-prod"
KEY_VAULT_NAME="kv-parliament-fuel-prod"
STORAGE_ACCOUNT="stparliamentfuelprod"

# Database configuration
DB_ADMIN_USER="parliament_admin"
DB_ADMIN_PASSWORD="ParliamentDB2025!@#"
DB_NAME="fuel_coupon_system"

echo "🏛️ Starting Azure deployment for Parliament Fuel Coupon System..."

# 1. Create Resource Group
echo "📁 Creating resource group..."
az group create \
    --name $RESOURCE_GROUP \
    --location "$LOCATION" \
    --tags Environment=Production Department=Parliament System=FuelCouponSystem

# 2. Create PostgreSQL Database
echo "🗄️ Creating PostgreSQL database..."
az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_SERVER_NAME \
    --admin-user $DB_ADMIN_USER \
    --admin-password $DB_ADMIN_PASSWORD \
    --sku-name Standard_B2s \
    --tier Burstable \
    --storage-size 128 \
    --version 14 \
    --location "$LOCATION" \
    --yes

# Configure database firewall to allow Azure services
echo "🔧 Configuring database firewall..."
az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_SERVER_NAME \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# Create application database
echo "📊 Creating application database..."
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $DB_SERVER_NAME \
    --database-name $DB_NAME

# 3. Create App Service Plan
echo "🌐 Creating App Service Plan..."
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku P1V3 \
    --is-linux \
    --location "$LOCATION"

# 4. Create Web App
echo "🚀 Creating Web App..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $WEB_APP_NAME \
    --runtime "PYTHON|3.11" \
    --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 config.wsgi"

# 5. Create Key Vault
echo "🔐 Creating Key Vault..."
az keyvault create \
    --name $KEY_VAULT_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --enable-soft-delete \
    --enable-purge-protection

# 6. Create Storage Account
echo "💾 Creating Storage Account..."
az storage account create \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2

# Create storage containers
echo "📦 Creating storage containers..."
az storage container create \
    --name static \
    --account-name $STORAGE_ACCOUNT \
    --public-access blob

az storage container create \
    --name media \
    --account-name $STORAGE_ACCOUNT \
    --public-access blob

# 7. Configure Web App Settings
echo "⚙️ Configuring Web App settings..."

# Get storage account key
STORAGE_KEY=$(az storage account keys list \
    --resource-group $RESOURCE_GROUP \
    --account-name $STORAGE_ACCOUNT \
    --query '[0].value' \
    --output tsv)

# Set application settings
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --settings \
        DJANGO_SETTINGS_MODULE=config.settings.production \
        DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com" \
        DB_NAME=$DB_NAME \
        DB_USER=$DB_ADMIN_USER \
        DB_PASSWORD=$DB_ADMIN_PASSWORD \
        DB_PORT=5432 \
        AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT \
        AZURE_STORAGE_ACCOUNT_KEY=$STORAGE_KEY \
        AZURE_STORAGE_CONTAINER=static \
        WEBSITE_HTTPLOGGING_RETENTION_DAYS=7 \
        SCM_DO_BUILD_DURING_DEPLOYMENT=true \
        ENABLE_ORYX_BUILD=true \
        PRE_BUILD_COMMAND="python -m pip install --upgrade pip" \
        POST_BUILD_COMMAND="python manage.py collectstatic --noinput && python manage.py migrate"

# 8. Enable HTTPS and configure SSL
echo "🔒 Configuring HTTPS..."
az webapp update \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --https-only true

# 9. Configure auto-scaling
echo "📈 Configuring auto-scaling..."
az monitor autoscale create \
    --resource-group $RESOURCE_GROUP \
    --name "${APP_SERVICE_PLAN}-autoscale" \
    --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/serverfarms/$APP_SERVICE_PLAN" \
    --min-count 1 \
    --max-count 5 \
    --count 2

# Add CPU scaling rule
az monitor autoscale rule create \
    --resource-group $RESOURCE_GROUP \
    --autoscale-name "${APP_SERVICE_PLAN}-autoscale" \
    --condition "Percentage CPU > 70 avg 5m" \
    --scale out 1

az monitor autoscale rule create \
    --resource-group $RESOURCE_GROUP \
    --autoscale-name "${APP_SERVICE_PLAN}-autoscale" \
    --condition "Percentage CPU < 30 avg 5m" \
    --scale in 1

# 10. Create Application Insights
echo "📊 Creating Application Insights..."
az monitor app-insights component create \
    --app $WEB_APP_NAME \
    --location "$LOCATION" \
    --resource-group $RESOURCE_GROUP \
    --kind web

# Get Application Insights instrumentation key
APPINSIGHTS_KEY=$(az monitor app-insights component show \
    --app $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query instrumentationKey \
    --output tsv)

# Add Application Insights to app settings
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --settings APPINSIGHTS_INSTRUMENTATIONKEY=$APPINSIGHTS_KEY

echo "✅ Azure resources created successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "🌐 Web App URL: https://$WEB_APP_NAME.azurewebsites.net"
echo "🗄️ Database Server: $DB_SERVER_NAME.postgres.database.azure.com"
echo "🔐 Key Vault: $KEY_VAULT_NAME"
echo "💾 Storage Account: $STORAGE_ACCOUNT"
echo ""
echo "🔑 Next Steps:"
echo "1. Store secrets in Key Vault"
echo "2. Configure custom domain (fuel.parliament.gov.zw)"
echo "3. Deploy application code"
echo "4. Run database migrations"
echo "5. Create admin users"
echo ""
echo "🚀 Ready for application deployment!"
