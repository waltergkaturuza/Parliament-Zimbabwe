@echo off
echo ================================================
echo  COMPREHENSIVE DJANGO STARTUP TEST
echo ================================================
echo.

echo [1/6] Setting environment...
set DJANGO_DEBUG=True
set DJANGO_SETTINGS_MODULE=config.settings

echo [2/6] Testing Python imports...
python -c "import django; print(f'Django version: {django.get_version()}')"
if %errorlevel% neq 0 (
    echo ERROR: Django import failed
    pause
    exit /b 1
)

echo [3/6] Testing Django setup...
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); import django; django.setup(); print('Django setup: OK')"
if %errorlevel% neq 0 (
    echo ERROR: Django setup failed
    pause
    exit /b 1
)

echo [4/6] Testing fuel.urls import...
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); import django; django.setup(); from fuel.urls import urlpatterns; print('fuel.urls import: OK')"
if %errorlevel% neq 0 (
    echo ERROR: fuel.urls import failed
    pause
    exit /b 1
)

echo [5/6] Running Django check...
python manage.py check
if %errorlevel% neq 0 (
    echo ERROR: Django check failed
    pause
    exit /b 1
)

echo [6/6] Starting Django development server...
echo.
echo ================================================
echo  ALL TESTS PASSED! STARTING SERVER...
echo  Access your application at: http://127.0.0.1:8000
echo ================================================
echo.
python manage.py runserver 127.0.0.1:8000
