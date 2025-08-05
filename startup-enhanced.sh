#!/bin/bash

# Parliament Fuel System - Enhanced Azure Startup with Migrations
echo "🏛️ Starting Parliament Fuel System with full migrations..."

# Set error handling
set -e  # Exit on any error
set -o pipefail  # Exit if any command in a pipeline fails

# Function to log with timestamp
log_with_timestamp() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [STARTUP] $1"
}

# Function to run command with error handling
run_command() {
    local command="$1"
    local description="$2"
    local required="${3:-true}"
    
    log_with_timestamp "🔄 $description..."
    
    if eval "$command"; then
        log_with_timestamp "✅ $description completed successfully"
        return 0
    else
        local exit_code=$?
        if [ "$required" = "true" ]; then
            log_with_timestamp "❌ CRITICAL: $description failed (exit code: $exit_code)"
            exit $exit_code
        else
            log_with_timestamp "⚠️ WARNING: $description failed (exit code: $exit_code) - continuing"
            return $exit_code
        fi
    fi
}

# Set working directory
cd /home/site/wwwroot || exit 1
log_with_timestamp "📁 Working directory: $(pwd)"

# Set Django environment
export DJANGO_SETTINGS_MODULE="config.settings.production"
export PYTHONPATH="/home/site/wwwroot"
export PYTHONUNBUFFERED=1  # Ensure logs are flushed immediately

log_with_timestamp "🔧 Environment configured:"
log_with_timestamp "   DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
log_with_timestamp "   PYTHONPATH: $PYTHONPATH"
log_with_timestamp "   PORT: ${PORT:-8000}"

# Check Python and Django
run_command "python --version" "Python version check"
run_command "python -c 'import django; print(f\"Django version: {django.get_version()}\")'" "Django import check"

# Install requirements with caching
if [ ! -f ".deps_installed" ] || [ "requirements.txt" -nt ".deps_installed" ]; then
    run_command "python -m pip install --upgrade pip" "Pip upgrade"
    run_command "python -m pip install -r requirements.txt --no-cache-dir" "Installing requirements"
    touch .deps_installed
else
    log_with_timestamp "📦 Requirements already installed and up to date"
fi

# Django configuration check
run_command "python manage.py check --deploy" "Django deployment configuration check" "false"

# Database connection test
log_with_timestamp "🔍 Testing database connection..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from django.db import connection
try:
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
        result = cursor.fetchone()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
" || {
    log_with_timestamp "❌ Database connection failed - check your database configuration"
    exit 1
}

# Run migrations
log_with_timestamp "🗄️ Running database migrations..."
run_command "python manage.py showmigrations" "Showing migration status" "false"
run_command "python manage.py migrate --noinput" "Applying migrations"

# Create superuser if it doesn't exist
log_with_timestamp "👤 Setting up admin user..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'AdminPass2025!')
    print('✅ Admin user created: admin/AdminPass2025!')
else:
    print('✅ Admin user already exists')
" || log_with_timestamp "⚠️ Admin user setup skipped"

# Collect static files
log_with_timestamp "📁 Collecting static files..."
run_command "python manage.py collectstatic --noinput --clear" "Static files collection" "false"

# Create fixtures for initial data
log_with_timestamp "🌱 Loading initial data..."
python manage.py shell -c "
from fuel.models import FuelData
import datetime

# Create default fuel data if none exists
if not FuelData.objects.exists():
    FuelData.objects.create(
        date=datetime.date.today(),
        petrol_price=1.65,
        diesel_price=1.58,
        allocation_limit=500.00
    )
    print('✅ Default fuel data created')
else:
    print('✅ Fuel data already exists')
" || log_with_timestamp "⚠️ Initial data setup skipped"

# Health check before starting server
log_with_timestamp "🏥 Running pre-startup health checks..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from django.test import Client
from django.conf import settings

client = Client()
try:
    # Test health endpoint
    response = client.get('/health/simple/')
    if response.status_code == 200:
        print('✅ Health endpoint working')
    else:
        print(f'⚠️ Health endpoint returned {response.status_code}')
    
    # Test CORS configuration
    print(f'✅ CORS origins configured: {len(settings.CORS_ALLOWED_ORIGINS)} origins')
    
    # Test database
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute('SELECT COUNT(*) FROM django_migrations')
        count = cursor.fetchone()[0]
    print(f'✅ Database has {count} migrations applied')
    
except Exception as e:
    print(f'⚠️ Health check failed: {e}')
" || log_with_timestamp "⚠️ Health check failed - continuing anyway"

# Start the application server
log_with_timestamp "🚀 Starting gunicorn server..."
log_with_timestamp "   Binding to: 0.0.0.0:${PORT:-8000}"
log_with_timestamp "   Workers: 2"
log_with_timestamp "   Timeout: 300 seconds"

exec gunicorn config.wsgi:application \
    --bind=0.0.0.0:${PORT:-8000} \
    --workers=2 \
    --worker-class=sync \
    --timeout=300 \
    --keep-alive=65 \
    --max-requests=1000 \
    --max-requests-jitter=100 \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=info \
    --capture-output \
    --enable-stdio-inheritance
