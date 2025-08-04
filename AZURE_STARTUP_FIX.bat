@echo off
echo.
echo ========================================
echo   AZURE APP SERVICE STARTUP FIX
echo ========================================
echo.

echo ❌ CURRENT PROBLEM:
echo    Azure startup command is wrong and causing the app to fail
echo.

echo ✅ SOLUTION - CHANGE AZURE STARTUP COMMAND:
echo.
echo 1. Go to Azure Portal
echo 2. Find "parliament-fuel-system" App Service  
echo 3. Go to Configuration ^> General Settings
echo 4. Change "Startup Command" from:
echo    ❌ OLD: gunicorn config.wsgi:application
echo    ✅ NEW: bash startup-simple.sh
echo 5. Click Save
echo 6. Go to Overview and click Restart
echo.

echo 🔧 ALTERNATIVE STARTUP COMMANDS (if first doesn't work):
echo    Option A: gunicorn config.wsgi:application --bind=0.0.0.0:$PORT --timeout=600
echo    Option B: python manage.py runserver 0.0.0.0:$PORT  
echo    Option C: Leave blank (Azure auto-detect)
echo.

echo 🌐 YOUR BACKEND URLs:
echo    Working URL: parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net
echo    Frontend points to this URL: ✅ CORRECT
echo.

echo 📋 ENVIRONMENT VARIABLES TO CHECK:
echo    In Azure Portal ^> Configuration ^> Application Settings:
echo    - DJANGO_SETTINGS_MODULE=config.settings.production
echo    - WEBSITES_PORT=8000
echo    - SCM_DO_BUILD_DURING_DEPLOYMENT=true
echo.

echo 🧪 AFTER RESTART, TEST THESE:
echo    - https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/health/
echo    - https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/auth/login/
echo.

echo The startup-simple.sh file has been created with the correct configuration.
echo.

pause

echo Opening Azure Portal...
start https://portal.azure.com/#home
echo.
echo Go fix the startup command now!
pause
