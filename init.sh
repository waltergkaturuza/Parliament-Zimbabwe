#!/bin/bash

# Azure App Service Django initialization script
echo "Starting Parliament Fuel Coupon System initialization..."

# Ensure we're in the right directory
cd /home/site/wwwroot

# Set environment variables
export DJANGO_SETTINGS_MODULE=config.settings.production
export DEBUG=False

# Install requirements if needed
echo "Installing requirements..."
pip install -r requirements.txt

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run database migrations
echo "Running database migrations..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser..."
python manage.py shell << EOF
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'Parliament2025!')
    print('Superuser created successfully')
else:
    print('Superuser already exists')
EOF

echo "Initialization complete. Starting gunicorn..."

# Start gunicorn with proper settings
exec gunicorn --bind=0.0.0.0:8000 --workers=2 --timeout=300 config.wsgi:application
