#!/bin/bash

echo "🔧 Fixing CORS Issue - Azure App Service Configuration"
echo "=================================================="

# Set the correct backend URL and CORS settings
az webapp config appsettings set \
  --resource-group parliament-fuel-rg \
  --name parliament-fuel-system \
  --settings \
    DJANGO_DEBUG="False" \
    DJANGO_ALLOWED_HOSTS="parliament-fuel-system.azurewebsites.net,parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net" \
    CORS_ALLOWED_ORIGINS="https://jolly-ocean-0e0dee90f.2.azurestaticapps.net,https://parliament-fuel-system.azurewebsites.net,https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net" \
    CORS_ALLOW_CREDENTIALS="True"

echo "✅ CORS settings updated"

# Restart the app service to apply changes  
az webapp restart \
  --resource-group parliament-fuel-rg \
  --name parliament-fuel-system

echo "✅ App Service restarted"

echo ""
echo "🎯 Updated Settings:"
echo "   Frontend URL: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net"
echo "   Backend URL:  https://parliament-fuel-system.azurewebsites.net"
echo ""
echo "The CORS issue should now be resolved!"
