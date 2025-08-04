#!/bin/bash

# Azure App Service Enhanced Startup Script with SSH Support
set -e

echo "🚀 Parliament Fuel System - Enhanced Startup"
echo "=============================================="

# Environment Configuration
export DJANGO_SETTINGS_MODULE="config.settings.production"
export PYTHONPATH="/home/site/wwwroot"
export PORT=${PORT:-8000}
export WEBSITES_PORT=${WEBSITES_PORT:-8000}

echo "🔧 Environment:"
echo "   Django Settings: $DJANGO_SETTINGS_MODULE"
echo "   Python Path: $PYTHONPATH"
echo "   Port: $PORT"

# Change to application directory
cd /home/site/wwwroot

# Install any missing dependencies
echo "📦 Installing dependencies..."
python -m pip install --upgrade pip --quiet
python -m pip install -r requirements.txt --quiet

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear || echo "⚠️ Static files collection had issues"

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --noinput || echo "⚠️ Migration had issues - continuing"

# Create superuser if it doesn't exist
echo "👤 Setting up admin user..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
from django.db import IntegrityError
User = get_user_model()
try:
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'Parliament2024!')
        print("✅ Admin user created: admin/Parliament2024!")
    else:
        print("✅ Admin user already exists")
except Exception as e:
    print(f"⚠️ Admin user setup error: {e}")
EOF

# Enable SSH if not already enabled (for Azure troubleshooting)
echo "🔧 Configuring SSH access..."
if [ ! -f "/etc/ssh/sshd_config.bak" ]; then
    # Backup original config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
    
    # Enable SSH with password authentication
    echo "Port 2222" >> /etc/ssh/sshd_config
    echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
    echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
    
    # Start SSH daemon
    service ssh start || echo "⚠️ SSH service not available"
fi

# Health check
echo "🏥 Running health check..."
python manage.py check --deploy || echo "⚠️ Health check had warnings"

# Start application
echo "🌐 Starting Gunicorn server..."
echo "   URL: https://parliament-fuel-system.azurewebsites.net"
echo "   Admin: https://parliament-fuel-system.azurewebsites.net/admin/"
echo "   API: https://parliament-fuel-system.azurewebsites.net/api/"

# Start with enhanced logging
exec gunicorn \
    --bind=0.0.0.0:$PORT \
    --workers=3 \
    --worker-class=gthread \
    --threads=2 \
    --timeout=600 \
    --keep-alive=2 \
    --max-requests=1000 \
    --max-requests-jitter=100 \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=info \
    --capture-output \
    --enable-stdio-inheritance \
    --preload \
    config.wsgi:application
