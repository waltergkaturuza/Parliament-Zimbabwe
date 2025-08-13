"""
Local development settings for Parliament Fuel Coupon System
"""

# Import everything from main settings first
from .settings import *
import os
from datetime import timedelta
from pathlib import Path

# Re-define BASE_DIR for this local settings file
BASE_DIR = Path(__file__).resolve().parent.parent

# Ensure ROOT_URLCONF is set
ROOT_URLCONF = 'config.urls'

# Override for local development
DEBUG = True

# Local development hosts
ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    '0.0.0.0',
]

# Database - Use SQLite for local development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Email settings for local development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
EMAIL_HOST = 'localhost'
EMAIL_PORT = 587
EMAIL_USE_TLS = False
EMAIL_USE_SSL = False
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''
DEFAULT_FROM_EMAIL = 'Parliament Fuel System <noreply@parliament.gov.zw>'
EMAIL_SUBJECT_PREFIX = '[Parliament Fuel System - Local] '

# CORS settings for local development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # React Vite dev server
    "http://localhost:5174",  # Alternative Vite port
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://localhost:8000",  # Django backend
    "http://127.0.0.1:8000",  # Django backend
]

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# CSRF settings for local development
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Disable some security features for easier local development
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Frontend URL for local development
FRONTEND_URL = 'http://localhost:5173'

# JWT settings for local development (longer tokens for easier testing)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),  # Longer for local dev
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # Longer for local dev
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-1*p133x5+uzwh8&axhdhi41jq=%&p(9)pzmoyob$(a01)rcs&z'),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# Enhanced logging for local development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'fuel': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'fuel.email_utils': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
log_dir = BASE_DIR / 'logs'
if not log_dir.exists():
    log_dir.mkdir(exist_ok=True)

# Disable Business Central integration for local development
DYNAMICS_SYNC_ENABLED = False

print("=== LOCAL DEVELOPMENT SETTINGS LOADED ===")
print(f"DEBUG: {DEBUG}")
print(f"EMAIL_BACKEND: {EMAIL_BACKEND}")
print(f"DATABASE: SQLite at {DATABASES['default']['NAME']}")
print(f"FRONTEND_URL: {FRONTEND_URL}")
print("=== Ready for local development ===")
