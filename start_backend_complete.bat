@echo off
echo ================================================
echo  DJANGO FUEL COUPON SYSTEM - STARTUP SCRIPT
echo ================================================
echo.

echo [1/5] Activating virtual environment...
call source\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo Warning: Could not activate virtual environment
)

echo [2/5] Setting environment variables...
set DJANGO_DEBUG=True
set DJANGO_SETTINGS_MODULE=config.settings

echo [3/5] Running Django system check...
python manage.py check --deploy
if %errorlevel% neq 0 (
    echo ERROR: Django check failed. Please fix the issues above.
    pause
    exit /b 1
)

echo [4/5] Checking database migrations...
python manage.py showmigrations | findstr /C:"[ ]"
if %errorlevel% equ 0 (
    echo Warning: There are unapplied migrations. Running migrate...
    python manage.py migrate
    if %errorlevel% neq 0 (
        echo ERROR: Migration failed
        pause
        exit /b 1
    )
)

echo [5/5] Starting Django development server...
echo.
echo ================================================
echo  SERVER STARTING ON http://127.0.0.1:8000
echo ================================================
echo  Press Ctrl+C to stop the server
echo ================================================
echo.

python manage.py runserver 127.0.0.1:8000
