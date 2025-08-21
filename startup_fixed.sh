#!/bin/bash

# IMPROVED Azure startup script - fixes migration issues
echo "=== PARLIAMENT FUEL SYSTEM STARTUP ==="
echo "Time: $(date)"
echo "Working dir: $(pwd)"
echo "Python version: $(python --version)"

# Set environment 
export DJANGO_SETTINGS_MODULE=config.settings.production
export PORT=${PORT:-8000}

# Ensure we have the right packages
echo "Installing requirements..."
pip install -r requirements.txt

# Show Django version
python -c "import django; print(f'Django version: {django.get_version()}')"

# Check database connection
echo "Testing database connection..."
python -c "
import django
django.setup()
from django.db import connection
try:
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
    print('✅ Database connection OK')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
"

# Show migration status
echo "Current migration status:"
python manage.py showmigrations fuel --plan 2>&1 | head -20

# Run migrations with verbose output
echo "Running migrations..."
python manage.py migrate --verbosity=2 2>&1 | tee migration.log

# Check if migrations were successful
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed - checking detailed log..."
    cat migration.log
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --verbosity=0

# Create admin user if needed
echo "Ensuring admin user exists..."
python -c "
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'Parliament2024!')
    print('✅ Admin user created')
else:
    print('✅ Admin user already exists')
"

# Start the server
echo "Starting Daphne server on port $PORT..."
exec daphne -b 0.0.0.0 -p $PORT config.asgi:application
