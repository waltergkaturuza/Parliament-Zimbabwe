@echo off
echo Parliament Fuel System - Fixed Dependency Installation
echo ====================================================

echo.
echo Step 1: Upgrading pip...
python -m pip install --upgrade pip

echo.
echo Step 2: Installing core Django dependencies first...
pip install "Django==5.0.7"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install Django
    pause
    exit /b 1
)

pip install "djangorestframework==3.15.2"
pip install "djangorestframework-simplejwt==5.3.0"

echo.
echo Step 3: Installing database dependencies...
pip install "psycopg2-binary==2.9.9"
pip install "dj-database-url==2.1.0"

echo.
echo Step 4: Installing Django extensions...
pip install "django-cors-headers==4.3.1"
pip install "django-model-utils==4.5.1"
pip install "django-extensions==3.2.3"
pip install "drf-spectacular==0.27.2"

echo.
echo Step 5: Installing background tasks (with compatible version)...
pip install "celery==5.3.4"
pip install "django-celery-beat==2.6.0"

echo.
echo Step 6: Installing remaining dependencies...
pip install "redis==5.0.1"
pip install "django-crispy-forms==2.1"
pip install "crispy-bootstrap5==2024.2"
pip install "pillow==10.4.0"
pip install "reportlab==4.2.2"
pip install "qrcode==7.4.2"
pip install "python-decouple==3.8"
pip install "django-allauth==0.57.0"
pip install "django-filter==23.5"
pip install "python-dateutil==2.9.0"
pip install "twilio==9.2.3"
pip install "channels==4.1.0"
pip install "channels-redis==4.2.0"
pip install "daphne==4.1.2"
pip install "django-environ==0.11.2"
pip install "gunicorn==21.2.0"
pip install "uvicorn==0.24.0"
pip install "msal==1.28.0"
pip install "requests==2.31.0"
pip install "applicationinsights==0.11.10"
pip install "whitenoise==6.9.0"
pip install "openpyxl==3.1.2"
pip install "pandas==2.2.2"
pip install "xlsxwriter==3.2.0"
pip install "fpdf2==2.7.9"
pip install "WeasyPrint==61.2"
pip install "jinja2==3.1.4"
pip install "sentry-sdk==1.40.6"
pip install "python-dotenv==1.0.0"

echo.
echo Step 7: Verifying installation...
python -c "import django; print('Django version:', django.get_version())"
python -c "import pandas; print('Pandas version:', pandas.__version__)"
python -c "import rest_framework; print('DRF installed successfully')"
python -c "import django_celery_beat; print('Celery Beat installed successfully')"

echo.
echo ✅ All dependencies installed successfully!
echo The dependency conflict has been resolved.
echo You can now run: python manage.py runserver

pause
