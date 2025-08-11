@echo off
echo CRITICAL AZURE PRODUCTION FIX - EXECUTE IMMEDIATELY
echo ======================================================

echo Step 1: Login to Azure
az login

echo Step 2: Set the correct subscription
az account set --subscription "fd25b7c1-1af9-4b59-ac13-93c9db2c9e0c"

echo Step 3: Execute Django migration via SSH
echo Connecting to Azure App Service SSH...
az webapp ssh --resource-group parliament-fuel-rg --name parliament-fuel-app --subscription "fd25b7c1-1af9-4b59-ac13-93c9db2c9e0c"

REM After SSH connection is established, run these commands in the SSH terminal:
REM cd /home/site/wwwroot
REM python manage.py migrate fuel --verbosity=2
REM python manage.py showmigrations fuel
REM exit

echo ======================================================
echo BACKUP OPTION: If SSH doesn't work, use Azure Cloud Shell
echo 1. Go to portal.azure.com
echo 2. Open Cloud Shell
echo 3. Run: az webapp ssh --resource-group parliament-fuel-rg --name parliament-fuel-app
echo 4. In SSH: cd /home/site/wwwroot && python manage.py migrate fuel
echo ======================================================

pause
