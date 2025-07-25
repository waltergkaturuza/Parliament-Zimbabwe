#!/bin/bash

# Minimal startup script for testing
echo "Testing minimal Django deployment..."

# Set minimal Django settings
export DJANGO_SETTINGS_MODULE=test_settings

# Install only essential dependencies
echo "Installing minimal dependencies..."
pip install Django==5.0.7
pip install djangorestframework==3.15.2
pip install django-cors-headers==4.3.1
pip install gunicorn==21.2.0

# Set default port
if [ -z "$PORT" ]; then
    export PORT=8000
    echo "PORT set to 8000"
fi

echo "PORT is: $PORT"

# Test Django
echo "Testing Django check..."
python manage.py check

# Create simple database
echo "Creating test database..."
python manage.py migrate --run-syncdb

echo "Starting gunicorn on port $PORT..."
exec gunicorn --bind=0.0.0.0:$PORT --workers=1 --timeout 120 --log-level debug config.wsgi:application
