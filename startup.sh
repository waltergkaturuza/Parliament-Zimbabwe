#!/bin/bash

# Azure App Service startup script for Django
echo "Starting Parliament Fuel Coupon System..."

# Set Django settings module
export DJANGO_SETTINGS_MODULE=config.settings.production

# Install dependencies
pip install -r requirements.txt

# Test Django configuration
echo "Testing Django configuration..."
python manage.py check

# Collect static files
python manage.py collectstatic --noinput

# Run database migrations
python manage.py migrate

# Create superuser if not exists (for initial setup)
echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'Parliament2025!') if not User.objects.filter(username='admin').exists() else print('Admin user already exists')" | python manage.py shell

echo "Startup complete. Starting gunicorn on port $PORT..."

# Start gunicorn with correct Azure App Service port binding
exec gunicorn --bind=0.0.0.0:$PORT --workers=4 --timeout 120 --log-level debug config.wsgi:application
