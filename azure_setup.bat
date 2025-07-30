@echo off
echo.
echo ==========================================
echo   AZURE MIGRATION AND SUPERUSER SETUP
echo ==========================================
echo.

echo Setting up environment for Azure PostgreSQL...

REM Set environment variables for Azure production
set DJANGO_SETTINGS_MODULE=config.settings.production
set DATABASE_NAME=parliament-fuel-postgres
set DATABASE_USER=parliament_admin
set DATABASE_PASSWORD=Parliament2024!
set DATABASE_HOST=parliament-fuel-postgres.postgres.database.azure.com
set DATABASE_PORT=5432
set SECRET_KEY=django-insecure-production-key-change-in-azure
set ALLOWED_HOSTS=parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net,parliament-fuel-system.azurewebsites.net

echo Environment configured for Azure PostgreSQL
echo.

echo Step 1: Testing database connection...
python manage.py check --database default
if %ERRORLEVEL% neq 0 (
    echo ❌ Database connection failed!
    pause
    exit /b 1
)
echo ✅ Database connection successful!
echo.

echo Step 2: Running migrations...
python manage.py migrate
if %ERRORLEVEL% neq 0 (
    echo ❌ Migrations failed!
    pause
    exit /b 1
)
echo ✅ Migrations completed!
echo.

echo Step 3: Creating superuser...
echo Please enter the following details:
echo - Username: admin
echo - Email: admin@parliament.gov.zw  
echo - Password: (choose a strong password)
echo.
python manage.py createsuperuser
if %ERRORLEVEL% neq 0 (
    echo ❌ Superuser creation failed!
    pause
    exit /b 1
)
echo ✅ Superuser created!
echo.

echo Step 4: Setting up initial data...
python manage.py loaddata fuel/fixtures/initial_data.json 2>nul
echo Initial data loaded (if available)
echo.

echo ==========================================
echo   SETUP COMPLETE!
echo ==========================================
echo.
echo ✅ Database migrations: COMPLETE
echo ✅ Superuser created: COMPLETE  
echo ✅ Azure PostgreSQL: CONNECTED
echo.
echo You can now:
echo 1. Login to Django admin at: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/admin/
echo 2. Use the fuel system at: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net/
echo.

pause
