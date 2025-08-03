#!/bin/bash
# Azure App Service Deployment Script
# This script should be run in the Azure Cloud Shell or local Azure CLI

# Variables
RESOURCE_GROUP="parliament-fuel-rg"
APP_SERVICE_PLAN="parliament-fuel-plan"
WEB_APP_NAME="parliament-fuel-system"
LOCATION="South Africa North"
PYTHON_VERSION="3.11"

echo "Deploying Parliament Fuel System to Azure App Service..."

# Create resource group (if it doesn't exist)
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create App Service Plan
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --sku B1 \
    --is-linux

# Create Web App
az webapp create \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --runtime "PYTHON|$PYTHON_VERSION"

# Configure environment variables
az webapp config appsettings set \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        DJANGO_DEBUG="False" \
        DJANGO_SECRET_KEY="your-secret-key-here-minimum-50-characters-long" \
        AZURE_HOSTNAME="$WEB_APP_NAME.azurewebsites.net" \
        FRONTEND_HOSTNAME="parliament-fuel-system.azurewebsites.net" \
        DJANGO_ALLOWED_HOSTS="$WEB_APP_NAME.azurewebsites.net,parliament-fuel-system.azurewebsites.net" \
        CORS_ALLOWED_ORIGINS="https://parliament-fuel-system.azurewebsites.net" \
        SECURE_SSL_REDIRECT="True" \
        SESSION_COOKIE_SECURE="True" \
        CSRF_COOKIE_SECURE="True"

# Configure startup command
az webapp config set \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 config.wsgi"

# Enable logging
az webapp log config \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --application-logging filesystem \
    --level information

echo "Azure App Service created successfully!"
echo "Web App URL: https://$WEB_APP_NAME.azurewebsites.net"
echo ""
echo "Next steps:"
echo "1. Configure your PostgreSQL database connection"
echo "2. Deploy your code using Git or Azure DevOps"
echo "3. Run database migrations"
echo "4. Test the application endpoints"
