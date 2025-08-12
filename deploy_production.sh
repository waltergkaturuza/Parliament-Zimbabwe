#!/bin/bash
# Parliament Fuel Coupon System - Production Deployment Script
# For cPanel hosting at parliament.co.zw

echo "🚀 Parliament Fuel Coupon System - Production Deployment"
echo "Domain: parliament.co.zw"
echo "Starting deployment process..."

# Navigate to application directory
cd ~/fuel-system

# Install Python dependencies (Python 3.6 compatible)
echo "📦 Installing Python dependencies for Python 3.6..."
pip install -r requirements-cpanel.txt

# Create production settings file
echo "⚙️ Creating production settings for Python 3.6 and Django 3.2..."
cat > config/settings/cpanel.py << 'EOF'
from .base import *
import os

# Production settings
DEBUG = False
ALLOWED_HOSTS = ['parliament.co.zw', 'www.parliament.co.zw', '129.232.213.109']

# Database configuration for cPanel MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'parliam1_fuel_system',
        'USER': 'parliam1_fuel_user',
        'PASSWORD': 'YOUR_DB_PASSWORD_HERE',  # Replace with actual password
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'sql_mode': 'traditional',
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}

# Static files configuration
STATIC_URL = '/static/'
STATIC_ROOT = '/home/parliam1/public_html/static/'

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = '/home/parliam1/public_html/media/'

# Security settings (Django 3.2 compatible)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Django 3.2 required setting
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email configuration for cPanel
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'mail.parliament.co.zw'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'system@parliament.co.zw'
EMAIL_HOST_PASSWORD = 'YOUR_EMAIL_PASSWORD'  # Set this up
DEFAULT_FROM_EMAIL = 'Parliament Fuel System <system@parliament.co.zw>'

# CORS settings for production (Django 3.2 compatible)
CORS_ALLOWED_ORIGINS = [
    "https://parliament.co.zw",
    "https://www.parliament.co.zw",
]

# Simple logging for Python 3.6
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/home/parliam1/django_errors.log',
        },
    },
    'root': {
        'handlers': ['file'],
    },
}

# Timezone setting
USE_TZ = True
TIME_ZONE = 'Africa/Harare'
EOF

# Create passenger_wsgi.py for production
echo "🌐 Creating WSGI configuration..."
cat > passenger_wsgi.py << 'EOF'
import os
import sys

# Add project directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.cpanel')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
EOF

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py makemigrations --settings=config.settings.cpanel
python manage.py migrate --settings=config.settings.cpanel

# Create superuser
echo "👤 Creating superuser account..."
echo "You'll be prompted to create an admin user..."
python manage.py createsuperuser --settings=config.settings.cpanel

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --settings=config.settings.cpanel

# Build frontend
echo "🎨 Building frontend..."
cd fuel-coupon-frontend
npm install --production
npm run build

# Copy frontend build to public_html
echo "📤 Deploying frontend to web root..."
cp -r dist/* ~/public_html/

# Go back to project root
cd ..

# Create .htaccess for proper routing
echo "⚙️ Configuring web server..."
cat > ~/public_html/.htaccess << 'EOF'
# Django application routing
RewriteEngine On

# Handle Django admin and API routes
RewriteRule ^(admin|api)/ - [L]

# Handle static and media files
RewriteRule ^(static|media)/ - [L]

# Route everything else to React app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
EOF

# Set proper permissions
echo "🔐 Setting file permissions..."
find ~/fuel-system -type f -exec chmod 644 {} \;
find ~/fuel-system -type d -exec chmod 755 {} \;
chmod 644 ~/public_html/.htaccess

echo ""
echo "✅ Deployment Complete!"
echo "🌐 Your Parliament Fuel Coupon System should now be live at:"
echo "   Website: http://www.parliament.co.zw"
echo "   Admin:   http://www.parliament.co.zw/admin"
echo "   API:     http://www.parliament.co.zw/api"
echo ""
echo "📧 Next steps:"
echo "1. Setup SSL certificate in cPanel"
echo "2. Configure email accounts"
echo "3. Test all system functionality"
echo "4. Update DNS if needed"
echo ""
echo "🎉 Parliament Fuel Coupon System is now LIVE!"
