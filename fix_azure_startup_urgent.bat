@echo off
echo.
echo 🏛️ PARLIAMENT FUEL SYSTEM - AZURE QUICK FIX
echo ================================================
echo.

echo 🚨 CRITICAL AZURE STARTUP ISSUE DETECTED
echo.
echo PROBLEM: Wrong startup command in Azure Portal
echo CURRENT:  gunicorn config.wsgi:application
echo REQUIRED: bash startup.sh
echo.

echo 🔧 MANUAL FIXES NEEDED IN AZURE PORTAL:
echo.
echo 1. Go to Azure Portal → parliament-fuel-system
echo 2. Navigate to: Configuration → General Settings
echo 3. Find "Startup Command" field
echo 4. Change from: gunicorn config.wsgi:application
echo 5. Change to:   bash startup.sh
echo 6. Click "Save"
echo 7. Go to Overview and click "Restart"
echo.

echo 🚀 ALTERNATIVE STARTUP COMMANDS (if startup.sh fails):
echo.
echo OPTION A (Recommended):
echo bash startup.sh
echo.
echo OPTION B (If bash fails):
echo sh startup.sh
echo.
echo OPTION C (Fallback):
echo python manage.py collectstatic --noinput ^&^& python manage.py migrate --noinput ^&^& gunicorn --bind=0.0.0.0:8000 --workers=2 config.wsgi:application
echo.

echo 📋 ENVIRONMENT VARIABLES TO VERIFY:
echo.
echo Go to: Configuration → Application Settings
echo Ensure these are set:
echo.
echo DJANGO_SETTINGS_MODULE = config.settings.production
echo PYTHONPATH = /home/site/wwwroot  
echo WEBSITES_PORT = 8000
echo DEBUG = False
echo ALLOWED_HOSTS = parliament-fuel-system.azurewebsites.net,*.azurewebsites.net
echo.

echo 🌐 FRONTEND API URL FIX:
echo.
echo In GitHub Actions workflow file, change:
echo FROM: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net
echo TO:   https://parliament-fuel-system.azurewebsites.net
echo.

echo 🔍 AFTER MAKING CHANGES:
echo.
echo 1. Wait 2-3 minutes for restart
echo 2. Test: https://parliament-fuel-system.azurewebsites.net/
echo 3. Test API: https://parliament-fuel-system.azurewebsites.net/api/health/
echo 4. Check logs: Azure Portal → Monitoring → Log Stream
echo.

pause

echo.
echo 🔧 Running local diagnostic...
python azure_deployment_diagnostic.py
echo.

echo ✅ SUMMARY: 
echo 1. Update Azure startup command to: bash startup.sh
echo 2. Verify environment variables are set
echo 3. Restart App Service
echo 4. Test the URLs above
echo.

echo Your app should start working after these changes! 🚀
pause
