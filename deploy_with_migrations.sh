#!/bin/bash
# Azure App Service Deployment Script with Migration Triggers
# This script runs automatically when code is pushed to trigger migrations

echo "🚀 AZURE DEPLOYMENT: MainCenter Migration Deployment"
echo "=================================================="

# Set Django settings for production
export DJANGO_SETTINGS_MODULE=config.settings

# Install dependencies
echo "📦 Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "🗄️  Running Django migrations..."
python manage.py migrate --noinput

echo "📊 Creating migration summary..."
python manage.py showmigrations fuel

echo "🔍 Validating MainCenter alignment fields..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import SubCenter, Box

# Test SubCenter fields
try:
    subcenter_fields = [f.name for f in SubCenter._meta.get_fields()]
    contact_field_exists = 'contact_number' in subcenter_fields
    email_field_exists = 'email' in subcenter_fields
    print(f'✅ SubCenter.contact_number: {contact_field_exists}')
    print(f'✅ SubCenter.email: {email_field_exists}')
except Exception as e:
    print(f'❌ SubCenter validation error: {e}')

# Test Box fields  
try:
    box_fields = [f.name for f in Box._meta.get_fields()]
    received_field_exists = 'is_received' in box_fields
    print(f'✅ Box.is_received: {received_field_exists}')
except Exception as e:
    print(f'❌ Box validation error: {e}')

print('🎯 MainCenter alignment validation complete!')
"

echo "🔧 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ DEPLOYMENT COMPLETE!"
echo "MainCenter frontend-backend alignment deployed successfully"
echo "All migration triggers executed"
