#!/bin/bash

# Azure App Service Deployment Script
# Parliament Fuel System - Direct Deployment

echo "🚀 Parliament Fuel System - Azure Deployment"
echo "=============================================="

# Azure resource details from production.py
APP_NAME="parliament-fuel-system"
RESOURCE_GROUP="DefaultResourceGroup-EUS" # Will be auto-detected
LOCATION="southafricanorth"

# From production.py settings
ACTUAL_URL="https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

echo "📋 Deployment Configuration:"
echo "   App Name: $APP_NAME"
echo "   URL: $ACTUAL_URL"
echo "   Location: $LOCATION"
echo ""

# 1. Check Azure CLI login
echo "🔐 Checking Azure CLI authentication..."
if ! az account show &> /dev/null; then
    echo "❌ Not logged into Azure CLI"
    echo "Please run: az login"
    exit 1
fi

# Get current subscription and resource groups
echo "📊 Current Azure context:"
az account show --output table
echo ""

# 2. List existing web apps to find our app
echo "🔍 Finding existing web apps..."
az webapp list --output table

# 3. Get the correct resource group for our app
echo "🔍 Finding resource group for app..."
RG=$(az webapp list --query "[?name=='$APP_NAME'].resourceGroup" --output tsv)
if [ -z "$RG" ]; then
    echo "❌ App $APP_NAME not found. Available apps:"
    az webapp list --query "[].{name:name, resourceGroup:resourceGroup}" --output table
    exit 1
fi

echo "✅ Found app '$APP_NAME' in resource group '$RG'"
RESOURCE_GROUP="$RG"

# 4. Show current app status
echo "📊 Current app status:"
az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "{name:name, state:state, hostNames:hostNames}" --output table

# 5. Create deployment package
echo "📦 Creating deployment package..."
# Update requirements.txt
pip freeze > requirements.txt

# 6. Deploy using az webapp up (simpler than deploy)
echo "🚀 Deploying application..."
az webapp up --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --plan "ASP-DefaultResourceGroupEUS-b63d"

# 7. Configure app settings
echo "⚙️ Configuring app settings..."
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings \
    DJANGO_SETTINGS_MODULE="config.settings.production" \
    PYTHONPATH="/home/site/wwwroot" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    WEBSITE_RUN_FROM_PACKAGE="0"

# 8. Set startup command
echo "🔧 Setting startup command..."
az webapp config set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --startup-file "startup.sh"

# 9. Restart the app
echo "🔄 Restarting application..."
az webapp restart --name "$APP_NAME" --resource-group "$RESOURCE_GROUP"

# 10. Show deployment logs
echo "📋 Getting deployment logs..."
az webapp log tail --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &
LOG_PID=$!

# Wait a bit then kill log tail
sleep 30
kill $LOG_PID 2>/dev/null

# 11. Test the deployment
echo "🧪 Testing deployment..."
curl -s -o /dev/null -w "%{http_code}" "$ACTUAL_URL/health/" || echo "Health check endpoint test"
curl -s -o /dev/null -w "%{http_code}" "$ACTUAL_URL/" || echo "Home endpoint test"

echo ""
echo "✅ Deployment completed!"
echo "🌐 Application URL: $ACTUAL_URL"
echo "📊 Admin Panel: $ACTUAL_URL/admin/"
echo "📋 API Docs: $ACTUAL_URL/api/schema/swagger-ui/"
echo ""
echo "To monitor logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
