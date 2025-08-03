@echo off
echo.
echo ==========================================
echo   STARTING DJANGO BACKEND SERVER
echo ==========================================
echo.

echo Setting environment variables...
set DJANGO_DEBUG=True
set DJANGO_SETTINGS_MODULE=config.settings.local
set DJANGO_SECRET_KEY=django-insecure-1*p133x5+uzwh8&axhdhi41jq=%&p(9)pzmoyob$(a01)rcs&z

echo.
echo Activating virtual environment...
call .\.venv\Scripts\activate.bat

echo.
echo Running Django migrations...
python manage.py migrate --settings=config.settings.local

echo.
echo Starting Django development server...
echo Backend will be available at: http://127.0.0.1:8000
echo Admin interface: http://127.0.0.1:8000/admin/
echo API documentation: http://127.0.0.1:8000/api/docs/
echo.

python manage.py runserver 127.0.0.1:8000 --settings=config.settings.local
