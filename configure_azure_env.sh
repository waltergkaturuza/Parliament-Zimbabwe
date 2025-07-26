#!/bin/bash
# Azure CLI script to configure App Service environment variables
# Run this in Azure Cloud Shell or with Azure CLI installed

# App Service details
RESOURCE_GROUP="parliament-fuel-postgres"
APP_NAME="parliament-fuel-system"

echo "🔧 Configuring Azure App Service Environment Variables..."
echo "Resource Group: $RESOURCE_GROUP"
echo "App Service: $APP_NAME"
echo ""

# Database Configuration
echo "📊 Setting Database Configuration..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings \
    DB_HOST="parliament-fuel-postgres.postgres.database.azure.com" \
    DB_NAME="parliament-fuel-db" \
    DB_USER="yekrzopkqr" \
    DB_PASSWORD="Un0vT5psBUBTSQdA" \
    DB_PORT="5432"

# Django Configuration
echo "🐍 Setting Django Configuration..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings \
    DJANGO_SECRET_KEY="parliament-fuel-secret-key-2025-production-$(date +%s)" \
    DJANGO_DEBUG="False" \
    DJANGO_SETTINGS_MODULE="config.settings.production" \
    DJANGO_ALLOWED_HOSTS="parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net,parliament-fuel-system.azurewebsites.net,*.azurewebsites.net"

# Python Configuration
echo "🔧 Setting Python Configuration..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings \
    PYTHONPATH="/home/site/wwwroot" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    WEBSITE_WEBDEPLOY_USE_SCM="true"

# Business Central Configuration (optional)
echo "💼 Setting Business Central Configuration..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings \
    BC_TENANT_ID="086c4475-d0ef-4d2b-871c-4e078a083db5" \
    BC_CLIENT_ID="c26c60eb-f154-40eb-b02e-f3997e083316" \
    BC_CLIENT_SECRET="us18Q~TnKoQ5hYlKNtIAweLGoTdqX7kSdvFTIcI1" \
    BC_ENVIRONMENT="Production"

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "🔄 Restarting App Service..."
az webapp restart --resource-group $RESOURCE_GROUP --name $APP_NAME

echo ""
echo "🎉 Configuration complete!"
echo "Wait 2-3 minutes for the app to restart and test again."
echo ""
echo "Test URL: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/"
