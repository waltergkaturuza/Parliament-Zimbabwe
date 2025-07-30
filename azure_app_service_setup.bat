@echo off
echo ==========================================
echo   AZURE APP SERVICE DJANGO MANAGEMENT
echo ==========================================
echo.

echo Step 1: Running migrations on Azure App Service...
az webapp config appsettings set --name parliament-fuel-system --resource-group rg-parliament-fuel --settings "POST_BUILD_COMMAND=python manage.py migrate"

echo.
echo Step 2: Restarting the app to trigger migrations...
az webapp restart --name parliament-fuel-system --resource-group rg-parliament-fuel

echo.
echo Step 3: Creating a deployment script for superuser creation...
echo Creating temporary script...

echo python manage.py createsuperuser --noinput --username admin --email admin@parliament.gov.za > temp_superuser.py
echo.
echo Note: You'll need to set the admin password manually after deployment
echo.

echo Step 4: Collecting static files via App Service...
az webapp config appsettings set --name parliament-fuel-system --resource-group rg-parliament-fuel --settings "POST_BUILD_COMMAND=python manage.py collectstatic --noinput && python manage.py migrate"

echo.
echo Step 5: Restarting app with all configurations...
az webapp restart --name parliament-fuel-system --resource-group rg-parliament-fuel

echo.
echo ==========================================
echo   AZURE SETUP INITIATED!
echo ==========================================
echo Check the Azure portal for deployment logs
pause
