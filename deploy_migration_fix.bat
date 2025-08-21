@echo off
echo === AZURE 500 ERROR FIX DEPLOYMENT ===

echo.
echo 🚀 DEPLOYING MIGRATION FIXES TO AZURE...
echo.

REM Add all changes
git add .

REM Commit with descriptive message
git commit -m "Fix Azure 500 errors: migrations + ALLOWED_HOSTS update

- Fixed startup_azure.py to not ignore migration errors
- Added startup_fixed.py with comprehensive migration handling
- Updated ALLOWED_HOSTS with missing Azure IP 169.254.129.3
- Added force_migrate.py for manual migration recovery
- Resolves missing category_multiplier column errors"

echo.
echo 📤 PUSHING TO AZURE...
git push azure main

echo.
echo ✅ DEPLOYMENT COMPLETE!
echo.
echo 🔧 NEXT STEPS:
echo 1. Go to Azure Portal -^> Your App Service
echo 2. Settings -^> Configuration -^> General Settings
echo 3. Change Startup Command to: python startup_fixed.py
echo 4. Save and Restart the app
echo.
echo 🔍 MONITOR:
echo - Application logs for migration status
echo - Admin access at /admin/ (admin/Parliament2024!)
echo - API endpoints should now return data
echo.

pause
