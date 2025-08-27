# Local Development Settings
import os
from .base import *

# Try to load environment variables from .env.local if it exists
try:
    from dotenv import load_dotenv
    env_file = os.path.join(BASE_DIR, '.env.local')
    if os.path.exists(env_file):
        load_dotenv(env_file)
except ImportError:
    # If dotenv is not available, skip loading .env file
    pass

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# ALLOWED_HOSTS for local development
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '*']

# Database - SQLite for local development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.local.sqlite3',
    }
}

# Secret key for local development
SECRET_KEY = os.environ.get('SECRET_KEY', 'local-dev-secret-key-parliament-fuel-system-2025-not-for-production')

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS settings for local development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# CSRF settings for local development
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5176',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]

# Email backend for local development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable security features for local development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Business Central Settings (disabled for local dev)
BC_INTEGRATION_ENABLED = False
BC_WEBHOOK_SECRET = 'local-dev-webhook-secret'

# Simple logging for local development
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
        'fuel': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

print("[LOCAL DEV] Using SQLite database for local development")
print(f"[LOCAL DEV] SECRET_KEY length: {len(SECRET_KEY)}")
print(f"[LOCAL DEV] DEBUG mode: {DEBUG}")
