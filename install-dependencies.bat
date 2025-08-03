@echo off
echo Testing Parliament Fuel System Dependencies Installation
echo ======================================================

echo.
echo Step 1: Upgrading pip to latest version...
python -m pip install --upgrade pip

echo.
echo Step 2: Installing requirements with fixed dependencies...
pip install -r requirements.txt

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Fixed requirements failed. Trying flexible requirements...
    pip install -r requirements-flexible.txt
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Both requirements files failed. Trying minimal installation...
        echo Installing core dependencies individually...
        
        pip install Django==5.0.7
        pip install djangorestframework==3.15.2
        pip install psycopg2-binary==2.9.9
        pip install django-cors-headers==4.3.1
        pip install pandas==2.2.2
        pip install gunicorn==21.2.0
        pip install whitenoise==6.9.0
    )
)

echo.
echo Step 3: Verifying Django installation...
python -c "import django; print(f'Django version: {django.get_version()}')"

echo.
echo Step 4: Verifying pandas installation...
python -c "import pandas; print(f'Pandas version: {pandas.__version__}')"

echo.
echo Step 5: Testing Django project check...
python manage.py check --deploy

echo.
echo ✅ Dependencies installation completed!
echo You can now run: python manage.py runserver

pause
