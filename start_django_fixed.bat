@echo off
echo Starting Django server for Parliament Fuel System...
echo.

cd /d "C:\Users\Administrator\Documents\POZ\fuel_coupon_system"

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Checking Django configuration...
python manage.py check

echo Starting server on localhost:8000...
python manage.py runserver 127.0.0.1:8000

echo.
echo If you see any errors above, press any key to continue...
pause
