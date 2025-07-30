@echo off
echo ==========================================
echo   AZURE CLI DJANGO MANAGEMENT
echo ==========================================
echo.

echo Step 1: Logging into Azure...
az login

echo.
echo Step 2: Running migrations on Azure App Service...
az webapp ssh --name parliament-fuel-system --resource-group rg-parliament-fuel --command "cd /home/site/wwwroot && python manage.py migrate"

echo.
echo Step 3: Creating superuser on Azure App Service...
echo This will prompt you for superuser details...
az webapp ssh --name parliament-fuel-system --resource-group rg-parliament-fuel --command "cd /home/site/wwwroot && python manage.py createsuperuser"

echo.
echo Step 4: Loading initial data (optional)...
set /p load_data="Load initial fuel data? (y/n): "
if /i "%load_data%"=="y" (
    az webapp ssh --name parliament-fuel-system --resource-group rg-parliament-fuel --command "cd /home/site/wwwroot && python manage.py loaddata fuel/fixtures/initial_data.json"
)

echo.
echo Step 5: Collecting static files...
az webapp ssh --name parliament-fuel-system --resource-group rg-parliament-fuel --command "cd /home/site/wwwroot && python manage.py collectstatic --noinput"

echo.
echo ==========================================
echo   AZURE SETUP COMPLETE!
echo ==========================================
pause
