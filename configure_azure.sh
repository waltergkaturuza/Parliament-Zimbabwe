#!/bin/bash

# Azure App Service Configuration Script
# This script ensures proper production settings are configured

echo "🔧 Configuring Azure App Service for Production"
echo "==============================================="

# Set startup command in Azure
az webapp config set \
    --resource-group parliament-fuel-rg \
    --name parliament-fuel-system-d0bvbjfrdbepdrfh \
    --startup-file "./startup.sh"

# Set essential app settings
echo "📝 Setting critical app settings..."

az webapp config appsettings set \
    --resource-group parliament-fuel-rg \
    --name parliament-fuel-system-d0bvbjfrdbepdrfh \
    --settings \
    DJANGO_SETTINGS_MODULE="config.settings.production" \
    PYTHONPATH="/home/site/wwwroot" \
    WEBSITES_PORT="8000" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    DEBUG_PRODUCTION_ISSUES="True" \
    ALLOWED_HOSTS="parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net,parliament-fuel-system.azurewebsites.net,jolly-ocean-0e0dee90f.2.azurestaticapps.net"

echo "✅ Azure configuration completed!"
echo ""
echo "🔄 Restarting app service..."
az webapp restart \
    --resource-group parliament-fuel-rg \
    --name parliament-fuel-system-d0bvbjfrdbepdrfh

echo "🎯 App service restarted. Monitor logs with:"
echo "az webapp log tail --resource-group parliament-fuel-rg --name parliament-fuel-system-d0bvbjfrdbepdrfh"
