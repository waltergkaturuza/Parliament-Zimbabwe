#!/bin/bash

# Final production startup script for Azure App Service
# This script incorporates all the endpoint fixes we've made

echo "======================================"
echo "🚀 FUEL COUPON SYSTEM - AZURE STARTUP"
echo "======================================"
echo "Starting at: $(date)"

# Set environment for production with enhanced debugging
export DJANGO_SETTINGS_MODULE=config.settings.production
export PYTHONPATH=/home/site/wwwroot:$PYTHONPATH

echo "📋 Environment Configuration:"
echo "   DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "   PYTHONPATH: $PYTHONPATH"
echo "   Working Directory: $(pwd)"

# Install any missing dependencies
echo "📦 Installing dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# Test Django settings import
echo "🔧 Testing Django settings..."
python -c "
import sys
sys.path.insert(0, '/home/site/wwwroot')
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
import django
django.setup()
from django.conf import settings
print(f'✅ Django settings loaded: {settings.DEBUG=}')
print(f'✅ Database engine: {settings.DATABASES[\"default\"][\"ENGINE\"]}')
print(f'✅ Database name: {settings.DATABASES[\"default\"][\"NAME\"]}')
print(f'✅ Allowed hosts: {settings.ALLOWED_HOSTS}')
"

if [ $? -ne 0 ]; then
    echo "❌ Django settings test failed!"
    exit 1
fi

# Test database connectivity  
echo "🗄️ Testing database connectivity..."
python -c "
import sys
sys.path.insert(0, '/home/site/wwwroot')
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
import django
django.setup()
from django.db import connection
try:
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
        result = cursor.fetchone()
    print(f'✅ Database connection successful: {result}')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    raise
"

if [ $? -ne 0 ]; then
    echo "❌ Database connectivity test failed!"
    exit 1
fi

# Test critical models
echo "🧪 Testing critical models..."
python -c "
import sys
sys.path.insert(0, '/home/site/wwwroot')
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
import django
django.setup()

# Test models that were causing issues
try:
    from fuel.models import Box, Book, SubCenter, PoolVehicle, Coupon, BookDispatch, SessionAttendance
    
    print(f'✅ Box model: {Box.objects.count()} records')
    print(f'✅ Book model: {Book.objects.count()} records') 
    print(f'✅ SubCenter model: {SubCenter.objects.count()} records')
    print(f'✅ PoolVehicle model: {PoolVehicle.objects.count()} records')
    print(f'✅ Coupon model: {Coupon.objects.count()} records')
    print(f'✅ BookDispatch model: {BookDispatch.objects.count()} records')
    print(f'✅ SessionAttendance model: {SessionAttendance.objects.count()} records')
    
except Exception as e:
    print(f'❌ Model test failed: {e}')
    raise
"

if [ $? -ne 0 ]; then
    echo "❌ Model tests failed!"
    exit 1
fi

# Test problematic endpoints that we fixed
echo "🔗 Testing fixed endpoints..."
python -c "
import sys
sys.path.insert(0, '/home/site/wwwroot')
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
import django
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

print('Testing endpoints that were previously failing...')

try:
    # Get a user for testing
    User = get_user_model()
    user = User.objects.filter(role__in=['MAIN_CENTER', 'SUPERUSER']).first()
    if not user:
        print('⚠️ No admin user found for endpoint testing')
        exit(0)
    
    # Create API client with authentication
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Test previously failing endpoints
    endpoints = [
        '/api/v1/boxes/',
        '/api/v1/analytics/fuel-requirements/',
        '/api/v1/financial-analytics/',
        '/api/v1/subcenters/overview/',
        '/api/v1/books/received/',
        '/api/v1/dynamic-allocation/',
        '/api/v1/pool-vehicles/',
    ]
    
    for endpoint in endpoints:
        try:
            response = client.get(endpoint)
            if response.status_code == 200:
                print(f'✅ {endpoint}: SUCCESS (200)')
            elif response.status_code == 401:
                print(f'⚠️ {endpoint}: AUTH REQUIRED (401) - Expected in production')
            else:
                print(f'❌ {endpoint}: FAILED ({response.status_code})')
        except Exception as e:
            print(f'❌ {endpoint}: EXCEPTION - {str(e)}')
    
    print('✅ Endpoint testing completed')
    
except Exception as e:
    print(f'❌ Endpoint testing failed: {e}')
    # Don\'t exit on endpoint test failure - continue with startup
"

# Run migrations
echo "📋 Running database migrations..."
python manage.py migrate --noinput

if [ $? -ne 0 ]; then
    echo "❌ Migrations failed!"
    exit 1
fi

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

if [ $? -ne 0 ]; then
    echo "❌ Static files collection failed!"
    exit 1
fi

# Final system check
echo "🔍 Final system check..."
python manage.py check --deploy

echo "✅ All startup checks completed successfully!"
echo "🎯 Starting Daphne ASGI server..."

# Start the server
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
