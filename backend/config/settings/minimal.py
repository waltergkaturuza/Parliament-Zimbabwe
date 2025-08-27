"""
Minimal production settings for debugging Azure deployment issues
"""
import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Simplified ALLOWED_HOSTS
ALLOWED_HOSTS = [
    'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net',
    'parliament-fuel-system.azurewebsites.net',
    '*.azurewebsites.net',
    'localhost',
    '127.0.0.1',
    '*'  # Temporary for debugging
]

# Minimal SECRET_KEY (will be overridden by environment variable)
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY') or 'debug-secret-key-replace-in-production'

# Use SQLite for debugging (no external dependencies)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '/tmp/debug.db',
    }
}

# Try to use PostgreSQL if available
db_url = os.environ.get('DATABASE_URL')
if db_url:
    import dj_database_url
    DATABASES = {
        "default": dj_database_url.config(
            default=db_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

# CORS settings - very permissive for debugging
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/tmp/static'

# Disable some middleware that might cause issues
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Logging
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
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

print(f"🔧 MINIMAL PRODUCTION SETTINGS LOADED")
print(f"🔧 ALLOWED_HOSTS: {ALLOWED_HOSTS}")
print(f"🔧 DATABASE: {DATABASES['default']['ENGINE']}")
print(f"🔧 SECRET_KEY: {'SET' if SECRET_KEY != 'debug-secret-key-replace-in-production' else 'USING DEBUG KEY'}")
