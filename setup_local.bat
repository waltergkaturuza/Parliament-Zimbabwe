@echo off
echo.
echo ==========================================
echo   PARLIAMENT FUEL SYSTEM - LOCAL SETUP
echo ==========================================
echo.

echo 🔧 Setting up local development environment...
echo.

echo Step 1: Activating virtual environment...
cd /d "C:\Users\Administrator\Documents\POZ\fuel_coupon_system"

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
    echo ✅ Virtual environment activated (.venv)
) else if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo ✅ Virtual environment activated (venv)
) else if exist "source\Scripts\activate.bat" (
    call source\Scripts\activate.bat
    echo ✅ Virtual environment activated (source folder)
) else (
    echo ❌ Virtual environment not found. Please create one first:
    echo    python -m venv venv
    echo    venv\Scripts\activate.bat
    pause
    exit /b 1
)

echo.
echo Step 2: Installing/updating dependencies...
pip install -r requirements.txt

echo.
echo Step 3: Running database migrations...
python manage.py migrate

echo.
echo Step 4: Creating superuser...
echo.
echo Enter details for the Django admin superuser:
python manage.py createsuperuser

echo.
echo Step 5: Setting up initial fuel data...
python manage.py shell -c "
from fuel.models import FuelData
from decimal import Decimal
import datetime

# Create initial fuel data if it doesn't exist
if not FuelData.objects.exists():
    fuel_data = FuelData.objects.create(
        petrol_price_usd=Decimal('1.45'),
        diesel_price_usd=Decimal('1.35'),
        usd_zwg_exchange_rate=Decimal('25.50'),
        timestamp=datetime.datetime.now()
    )
    print('✅ Initial fuel data created')
    print(f'   Petrol: ${fuel_data.petrol_price_usd} USD/L')
    print(f'   Diesel: ${fuel_data.diesel_price_usd} USD/L')
    print(f'   Exchange Rate: 1 USD = {fuel_data.usd_zwg_exchange_rate} ZWG')
else:
    print('✅ Fuel data already exists')
"

echo.
echo Step 6: Collecting static files...
python manage.py collectstatic --noinput

echo.
echo ==========================================
echo   LOCAL SETUP COMPLETE!
echo ==========================================
echo.
echo 🚀 You can now:
echo.
echo 1. Start the development server:
echo    python manage.py runserver
echo.
echo 2. Access the admin panel:
echo    http://127.0.0.1:8000/admin/
echo.
echo 3. Access the API:
echo    http://127.0.0.1:8000/api/
echo.
echo 4. Test CORS with frontend:
echo    Frontend: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net
echo    Backend:  http://127.0.0.1:8000
echo.

pause
echo.
echo Starting development server...
python manage.py runserver
