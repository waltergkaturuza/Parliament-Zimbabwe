@echo off
echo Starting Django Backend Server...
echo.
echo Backend will be available at: http://localhost:8000
echo Frontend will proxy API calls to the backend
echo.

REM Start Django server
cd /d "C:\Users\Administrator\Documents\POZ\fuel_coupon_system"
call .venv\Scripts\activate.bat
python manage.py runserver 8000

pause
