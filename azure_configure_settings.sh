#!/bin/bash
# Azure Settings Configuration Script
# This script configures Azure to use the correct Django settings module

echo "🔧 AZURE SETTINGS CONFIGURATION"
echo "================================"

# Set the Django settings module to use production settings
echo "Setting DJANGO_SETTINGS_MODULE to use production settings..."

# If you have Azure CLI installed, use this command:
# Replace YOUR_APP_NAME and YOUR_RESOURCE_GROUP with your actual values
echo "Run this command in Azure CLI:"
echo ""
echo "az webapp config appsettings set \\"
echo "  --name YOUR_APP_NAME \\"
echo "  --resource-group YOUR_RESOURCE_GROUP \\"
echo "  --settings DJANGO_SETTINGS_MODULE=config.settings.production"
echo ""

# Or set it manually in Azure Portal:
echo "Or set manually in Azure Portal:"
echo "1. Go to Azure Portal → App Service → Configuration"
echo "2. In Application Settings, add or modify:"
echo "   Name: DJANGO_SETTINGS_MODULE"
echo "   Value: config.settings.production"
echo "3. Click Save and Restart the app"
echo ""

echo "This will ensure Azure uses:"
echo "✅ PostgreSQL database (not SQLite)"
echo "✅ Production CORS settings"
echo "✅ Proper security configurations"
echo "✅ Azure-specific environment variables"

echo ""
echo "After setting this, restart your app service for changes to take effect."
