#!/bin/bash

# Simple startup script for testing
echo "=== SIMPLE STARTUP TEST ==="
echo "PORT: $PORT"
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Available files:"
ls -la

# Set default port if not provided
if [ -z "$PORT" ]; then
    export PORT=8000
    echo "PORT was empty, setting to 8000"
fi

# Test basic Python functionality
echo "Testing Python..."
python -c "print('Python is working')"

# Set minimal environment
export DJANGO_SETTINGS_MODULE=config.settings.production
export SECRET_KEY=simple-test-key-123

# Install minimal requirements
echo "Installing basic requirements..."
pip install Django==5.0.7 gunicorn==21.2.0

# Create simple test Django setup
echo "Testing Django import..."
python -c "import django; print(f'Django version: {django.get_version()}')"

# Simple Django check
echo "Running Django check..."
python manage.py check --deploy 2>&1 || echo "Django check failed, continuing..."

echo "Starting gunicorn on port $PORT..."
exec gunicorn --bind=0.0.0.0:$PORT --workers=1 --timeout=60 --log-level=debug config.wsgi:application
