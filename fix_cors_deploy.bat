@echo off
echo.
echo 🔧 FIXING CORS ISSUE AND BACKEND DEPLOYMENT
echo ==========================================
echo.

echo Problem identified:
echo ❌ Backend URL 'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net' returns 404
echo ❌ This causes CORS preflight failures
echo.

echo Solution:
echo ✅ Deploy backend to correct URL: 'parliament-fuel-system.azurewebsites.net'
echo ✅ Frontend already updated to use correct backend URL
echo ✅ CORS headers are properly configured
echo.

echo Step 1: Checking Azure CLI login...
az account show >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to Azure first:
    echo az login
    pause
    exit /b 1
)

echo.
echo Step 2: Creating/updating Azure App Service...

echo Creating Resource Group...
az group create ^
  --name parliament-fuel-rg ^
  --location "South Africa North" ^
  --output table

echo.
echo Creating App Service Plan...
az appservice plan create ^
  --name parliament-fuel-plan ^
  --resource-group parliament-fuel-rg ^
  --location "South Africa North" ^
  --sku B1 ^
  --is-linux ^
  --output table

echo.
echo Creating Web App with correct name...
az webapp create ^
  --name parliament-fuel-system ^
  --resource-group parliament-fuel-rg ^
  --plan parliament-fuel-plan ^
  --runtime "PYTHON:3.11" ^
  --output table

echo.
echo Step 3: Configuring app settings...
az webapp config appsettings set ^
  --name parliament-fuel-system ^
  --resource-group parliament-fuel-rg ^
  --settings ^
    DJANGO_SETTINGS_MODULE=config.settings.production ^
    PYTHONPATH=/home/site/wwwroot ^
    SCM_DO_BUILD_DURING_DEPLOYMENT=true ^
    ENABLE_ORYX_BUILD=true ^
    POST_BUILD_SCRIPT_PATH=startup.sh

echo.
echo Step 4: Setting up deployment from GitHub...
az webapp deployment source config ^
  --name parliament-fuel-system ^
  --resource-group parliament-fuel-rg ^
  --repo-url https://github.com/waltergkaturuza/Parliament-Zimbabwe ^
  --branch main ^
  --manual-integration

echo.
echo Step 5: Updating startup command...
az webapp config set ^
  --name parliament-fuel-system ^
  --resource-group parliament-fuel-rg ^
  --startup-file "startup.sh"

echo.
echo ✅ Backend deployment configured!
echo.
echo Next steps:
echo 1. Wait for deployment to complete (5-10 minutes)
echo 2. Frontend will automatically use the correct URL
echo 3. CORS should be resolved
echo.
echo Monitor deployment:
echo az webapp log tail --name parliament-fuel-system --resource-group parliament-fuel-rg
echo.
echo Test the backend:
echo curl https://parliament-fuel-system.azurewebsites.net/api/health/
echo.

pause

echo.
echo Opening Azure portal to monitor deployment...
start https://portal.azure.com/#@admin.parliament.gov.zw/resource/subscriptions/77afc77a-93cd-43d5-ab2d-15f5ea770b4/resourceGroups/parliament-fuel-rg/providers/Microsoft.Web/sites/parliament-fuel-system/deploymentCenter

echo.
pause
