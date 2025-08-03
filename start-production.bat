@echo off
echo Parliament Fuel System - Production Mode
echo ========================================

echo.
echo Setting up production environment...
set DJANGO_SETTINGS_MODULE=config.settings.production
set DJANGO_DEBUG=False
set DJANGO_SECRET_KEY=parliament-fuel-secret-key-2024-production-environment-secure

echo.
echo Environment Configuration:
echo DJANGO_SETTINGS_MODULE=%DJANGO_SETTINGS_MODULE%
echo DJANGO_DEBUG=%DJANGO_DEBUG%

echo.
echo Starting Django with production settings...
python manage.py collectstatic --noinput
python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000

pause
