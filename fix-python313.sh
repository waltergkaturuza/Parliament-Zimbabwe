#!/bin/bash

# Azure Python 3.13 Compatibility Fix Script
echo "🔧 AZURE PYTHON 3.13 COMPATIBILITY FIX"
echo "======================================="

# Set environment
export DJANGO_SETTINGS_MODULE=config.settings.production
export PYTHONPATH="/home/site/wwwroot:$PYTHONPATH"

# Navigate to app directory
cd /home/site/wwwroot

echo "🐍 Python Environment Check:"
python --version
pip --version

echo "📦 Upgrading pip for Python 3.13 compatibility..."
pip install --upgrade pip

echo "🔄 Installing Python 3.13 compatible psycopg..."
pip install --force-reinstall --no-deps psycopg[binary]==3.2.3

echo "🔄 Fallback: Installing latest psycopg2-binary..."
pip install --force-reinstall psycopg2-binary==2.9.10

echo "🧪 Testing PostgreSQL connection..."
python -c "
try:
    import psycopg
    print('✅ psycopg (v3) imported successfully')
except ImportError:
    try:
        import psycopg2
        print('✅ psycopg2 imported successfully')
    except ImportError as e:
        print(f'❌ PostgreSQL driver import failed: {e}')
        exit(1)

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
try:
    import django
    django.setup()
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
"

echo "✅ Python 3.13 compatibility fix complete!"
