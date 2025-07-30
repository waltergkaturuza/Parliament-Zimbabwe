@echo off
echo ==========================================
echo   AZURE CLOUD SHELL DJANGO SETUP
echo ==========================================
echo.

echo Step 1: Using Azure Cloud Shell to run Django commands...
echo Opening Azure Cloud Shell - you'll need to manually run these commands:
echo.
echo ==== COMMANDS TO RUN IN AZURE CLOUD SHELL ====
echo.
echo # 1. First, clone your repository in Cloud Shell:
echo git clone https://github.com/your-repo/fuel_coupon_system.git
echo cd fuel_coupon_system
echo.
echo # 2. Install dependencies:
echo pip install -r requirements.txt
echo.
echo # 3. Set environment variables:
echo export DATABASE_HOST="parliament-fuel-postgres.postgres.database.azure.com"
echo export DATABASE_NAME="parliament-fuel-db"
echo export DATABASE_USER="yekrzopkqr@parliament-fuel-postgres"
echo export DATABASE_PASSWORD="Un0vT5psBUBTSQdA"
echo export DATABASE_PORT="5432"
echo export DJANGO_SETTINGS_MODULE="config.settings.production"
echo export SECRET_KEY="parliament-fuel-secret-281841429-20250725143959"
echo.
echo # 4. Run migrations:
echo python manage.py migrate
echo.
echo # 5. Create superuser:
echo python manage.py createsuperuser
echo.
echo # 6. Load initial data (optional):
echo python manage.py loaddata fuel/fixtures/initial_data.json
echo.
echo ==== END OF COMMANDS ====
echo.
echo Opening Azure Cloud Shell...
start https://shell.azure.com

echo.
echo Follow the commands above in the Cloud Shell to complete setup.
pause
