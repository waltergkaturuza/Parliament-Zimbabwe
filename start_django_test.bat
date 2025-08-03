@echo off
echo Starting Django server test...
python manage.py check
if %errorlevel% neq 0 (
    echo Django check failed
    pause
    exit /b 1
)

echo Django check passed! Starting server...
python manage.py runserver 127.0.0.1:8000
pause
