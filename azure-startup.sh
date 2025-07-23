#!/bin/bash

# Simplified Azure App Service startup script
echo "=== Starting Parliament Fuel Coupon System ==="

# Set Django settings
export DJANGO_SETTINGS_MODULE=config.settings.production

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Test Django configuration
echo "Testing Django configuration..."
python -c "import django; django.setup(); print('Django setup successful')"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --verbosity=2

# Check migrations
echo "Checking migrations..."
python manage.py showmigrations

# Run migrations (if database is available)
echo "Running migrations..."
python manage.py migrate --verbosity=2

echo "=== Starting Gunicorn Server ==="
# Start gunicorn with better error handling
exec gunicorn --bind=0.0.0.0:8000 --workers=2 --worker-class=sync --timeout=60 --keep-alive=5 --max-requests=1000 --preload config.wsgi:application --log-level=info
