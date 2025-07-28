#!/bin/bash
# Fix CORS Issue and Deploy Backend to Correct URL

echo "🔧 FIXING CORS ISSUE AND BACKEND DEPLOYMENT"
echo "=========================================="
echo ""

echo "Problem identified:"
echo "❌ Backend URL 'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net' returns 404"
echo "❌ This causes CORS preflight failures"
echo ""

echo "Solution:"
echo "✅ Deploy backend to correct URL: 'parliament-fuel-system.azurewebsites.net'"
echo "✅ Update frontend to use correct backend URL"
echo "✅ Fix CORS headers"
echo ""

echo "Step 1: Deploying Django backend to correct Azure App Service..."

# Check if logged into Azure
if ! az account show &> /dev/null; then
    echo "Please login to Azure first:"
    echo "az login"
    exit 1
fi

echo "Creating/updating Azure App Service..."

# Create Resource Group if it doesn't exist
az group create \
  --name parliament-fuel-rg \
  --location "South Africa North" \
  --output table

# Create App Service Plan if it doesn't exist
az appservice plan create \
  --name parliament-fuel-plan \
  --resource-group parliament-fuel-rg \
  --location "South Africa North" \
  --sku B1 \
  --is-linux \
  --output table

# Create Web App with correct name
az webapp create \
  --name parliament-fuel-system \
  --resource-group parliament-fuel-rg \
  --plan parliament-fuel-plan \
  --runtime "PYTHON:3.11" \
  --output table

echo ""
echo "Step 2: Configuring app settings..."

# Configure Django settings
az webapp config appsettings set \
  --name parliament-fuel-system \
  --resource-group parliament-fuel-rg \
  --settings \
    DJANGO_SETTINGS_MODULE=config.settings.production \
    PYTHONPATH=/home/site/wwwroot \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
    POST_BUILD_SCRIPT_PATH=startup.sh

echo ""
echo "Step 3: Setting up deployment from GitHub..."

# Configure GitHub deployment
az webapp deployment source config \
  --name parliament-fuel-system \
  --resource-group parliament-fuel-rg \
  --repo-url https://github.com/waltergkaturuza/Parliament-Zimbabwe \
  --branch main \
  --manual-integration

echo ""
echo "Step 4: Updating startup command..."

az webapp config set \
  --name parliament-fuel-system \
  --resource-group parliament-fuel-rg \
  --startup-file "startup.sh"

echo ""
echo "✅ Backend deployment configured!"
echo ""
echo "Next steps:"
echo "1. Wait for deployment to complete (5-10 minutes)"
echo "2. Frontend will automatically use the correct URL"
echo "3. CORS should be resolved"
echo ""
echo "Monitor deployment:"
echo "az webapp log tail --name parliament-fuel-system --resource-group parliament-fuel-rg"
echo ""
echo "Test the backend:"
echo "curl https://parliament-fuel-system.azurewebsites.net/api/health/"
