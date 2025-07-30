@echo off
echo.
echo ==========================================
echo   AZURE DJANGO REMOTE MANAGEMENT
echo ==========================================
echo.

echo This will manage your Django app on Azure PostgreSQL
echo.

echo Available operations:
echo 1. Check database connection
echo 2. Run migrations  
echo 3. Create superuser
echo 4. Collect static files
echo 5. Show migration status
echo.

echo Connecting to:
echo Database: parliament-fuel-postgres.postgres.database.azure.com
echo Database Name: parliament-fuel-postgres
echo User: parliament_admin
echo.

python azure_manage.py

pause
