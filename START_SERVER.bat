@echo off
echo ==========================================
echo       DJANGO SERVER STARTUP SCRIPT
echo ==========================================
echo.

echo Changing directory...
cd /d "c:\Users\Administrator\Documents\POZ\fuel_coupon_system"

echo.
echo Current directory: %CD%

echo.
echo Setting environment variables...
set DJANGO_DEBUG=True
set DJANGO_SETTINGS_MODULE=config.settings

echo.
echo Starting Django development server...
echo Server will be available at: http://127.0.0.1:8000
echo.
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver 127.0.0.1:8000

echo.
echo Server stopped.
pause
