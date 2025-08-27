# Vercel Production Settings for Parliament Fuel System
import os
import dj_database_url
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

print("[VERCEL SETTINGS] Using config/settings/vercel.py")

# Vercel environment
VERCEL = True
VERCEL_URL = os.environ.get('VERCEL_URL', '')

# Allowed hosts for Vercel
ALLOWED_HOSTS = [
    '.vercel.app',
    'parliament-fuel-system.vercel.app',
    'zw-parliament-fuel-system.vercel.app',
    VERCEL_URL,
    'localhost',
    '127.0.0.1',
]

# Remove None/empty values
ALLOWED_HOSTS = [host for host in ALLOWED_HOSTS if host]

print(f"[VERCEL] ALLOWED_HOSTS: {ALLOWED_HOSTS}")

# Database - Supabase PostgreSQL
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Ensure SSL is required for Supabase
if DATABASES['default'].get('ENGINE') == 'django.db.backends.postgresql':
    DATABASES['default']['OPTIONS'] = {
        'sslmode': 'require',
        'connect_timeout': 10,
    }

print(f"[VERCEL] Database engine: {DATABASES['default'].get('ENGINE')}")
print(f"[VERCEL] Database name: {DATABASES['default'].get('NAME')}")

# Secret key from environment
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required")

# Static files configuration for Vercel
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS settings for Vercel deployment
CORS_ALLOWED_ORIGINS = [
    # Backend domains
    'https://parliament-fuel-system.vercel.app',
    'https://zw-parliament-fuel-system.vercel.app',
    # Frontend domains
    'https://parliament-fuel-frontend.vercel.app',
    'https://zw-parliament-fuel-frontend.vercel.app',
    # Development
    'http://localhost:3000',
    'http://localhost:5173',  # Vite default port
]

# Add Vercel URL if available
if VERCEL_URL:
    CORS_ALLOWED_ORIGINS.append(f'https://{VERCEL_URL}')

CORS_ALLOW_CREDENTIALS = True

# CSRF trusted origins
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS.copy()

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Session configuration
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# CSRF configuration
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# Logging for Vercel
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Business Central settings (if using)
BUSINESS_CENTRAL_CONFIG = {
    'tenant_id': os.environ.get('BC_TENANT_ID'),
    'client_id': os.environ.get('BC_CLIENT_ID'),
    'client_secret': os.environ.get('BC_CLIENT_SECRET'),
    'environment': os.environ.get('BC_ENVIRONMENT', 'Production'),
    'company_id': os.environ.get('BC_COMPANY_ID'),
    'base_url': os.environ.get('BC_BASE_URL'),
    'api_version': 'v2.0',
}
