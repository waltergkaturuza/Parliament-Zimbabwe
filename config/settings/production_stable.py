# Stable Production Django Settings for Azure - v2
import os
from .base import *
import logging

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# ALLOWED_HOSTS - Read from environment or use defaults
_env_allowed_hosts = os.environ.get('DJANGO_ALLOWED_HOSTS') or os.environ.get('ALLOWED_HOSTS')
if _env_allowed_hosts:
    ALLOWED_HOSTS = [h.strip() for h in _env_allowed_hosts.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = [
        'parliament-fuel-system.azurewebsites.net',
        'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net',
        'fuel.parliament.gov.zw',
        'parliament.gov.zw',
        'localhost',
        '127.0.0.1',
        '169.254.131.6',  # Azure internal IP
        '169.254.131.1',  # Azure internal IP  
        '169.254.131.5',  # Azure internal IP
        '0.0.0.0',        # Wildcard for Azure
        '*',              # Allow all (temporary for debugging)
    ]

# Database - Azure PostgreSQL with fallback handling
import dj_database_url

# Check for individual database environment variables first
db_name = os.environ.get('DATABASE_NAME') or os.environ.get('DB_NAME')
db_user = os.environ.get('DATABASE_USER') or os.environ.get('DB_USER')
db_password = os.environ.get('DATABASE_PASSWORD') or os.environ.get('DB_PASSWORD')
db_host = os.environ.get('DATABASE_HOST') or os.environ.get('DB_HOST')
db_port = os.environ.get('DATABASE_PORT') or os.environ.get('DB_PORT', '5432')

if all([db_name, db_user, db_password, db_host]):
    # Use individual variables (preferred for Azure PostgreSQL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name,
            'USER': db_user,
            'PASSWORD': db_password,
            'HOST': db_host,
            'PORT': db_port,
            'OPTIONS': {
                'sslmode': 'require',
            },
        }
    }
elif os.environ.get('DATABASE_URL'):
    # Use DATABASE_URL as fallback
    DATABASES = {
        "default": dj_database_url.config(
            default=os.environ.get("DATABASE_URL")
        )
    }
else:
    # Emergency fallback to prevent app crash (should be temporary)
    print("WARNING: No database configuration found. Using SQLite fallback.")
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'temp_db.sqlite3'),
        }
    }

# SECRET_KEY with proper fallback
_env_secret_key = os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY')
if _env_secret_key and _env_secret_key.strip():
    SECRET_KEY = _env_secret_key.strip()
else:
    # Generate a temporary secret key (should be replaced in production)
    import secrets
    SECRET_KEY = secrets.token_urlsafe(50)
    print("WARNING: Using generated SECRET_KEY. Set DJANGO_SECRET_KEY environment variable.")

# Business Central Settings
BUSINESS_CENTRAL_CONFIG = {
    'tenant_id': os.environ.get('BC_TENANT_ID'),
    'client_id': os.environ.get('BC_CLIENT_ID'),
    'client_secret': os.environ.get('BC_CLIENT_SECRET'),
    'environment': os.environ.get('BC_ENVIRONMENT', 'Production'),
    'company_id': os.environ.get('BC_COMPANY_ID'),
    'base_url': os.environ.get('BC_BASE_URL'),
    'api_version': 'v2.0',
}

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('SMTP_HOST', 'smtp.office365.com')
EMAIL_PORT = int(os.environ.get('SMTP_PORT', '587'))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('SMTP_USER')
EMAIL_HOST_PASSWORD = os.environ.get('SMTP_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('SMTP_USER', 'fuel-system@parliament.gov.zw')

# Static files - Simple configuration for Azure App Service
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Security settings for Azure App Service
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = False  # Azure handles SSL termination
SESSION_COOKIE_SECURE = False  # Let Azure handle SSL
CSRF_COOKIE_SECURE = False  # Let Azure handle SSL
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
X_FRAME_OPTIONS = 'SAMEORIGIN'

# CSRF settings
CSRF_TRUSTED_ORIGINS = [
    'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',
    'https://parliament-fuel-frontend.azurestaticapps.net',
    'https://fuel.parliament.gov.zw',
    'https://parliament.gov.zw',
    'https://parliament-fuel-system.azurewebsites.net',
    'https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net',
]

# CORS settings - Simplified for production stability
CORS_ALLOWED_ORIGINS = [
    'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',
    'https://parliament-fuel-frontend.azurestaticapps.net',
    'https://fuel.parliament.gov.zw',
    'https://parliament.gov.zw',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False
CORS_PREFLIGHT_MAX_AGE = 86400

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',
    'pragma',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
    'HEAD',
]

# Simplified logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {asctime} {name} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'level': 'INFO',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',  # Reduced logging to prevent noise
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'fuel': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 3600 * 8  # 8 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Business Central Integration
BC_INTEGRATION_ENABLED = os.environ.get('BC_INTEGRATION_ENABLED', 'True').lower() == 'true'
BC_WEBHOOK_SECRET = os.environ.get('BC_WEBHOOK_SECRET', 'change-this-in-production')
BC_API_TIMEOUT = 30

# Application Insights (if available)
APPINSIGHTS_INSTRUMENTATIONKEY = os.environ.get('APPINSIGHTS_INSTRUMENTATIONKEY')
if APPINSIGHTS_INSTRUMENTATIONKEY:
    try:
        import applicationinsights.django
        INSTALLED_APPS += ['applicationinsights.django']
        APPLICATION_INSIGHTS = {
            'ikey': APPINSIGHTS_INSTRUMENTATIONKEY,
            'use_view_name': True,
        }
        MIDDLEWARE = ['applicationinsights.django.ApplicationInsightsMiddleware'] + MIDDLEWARE
    except ImportError:
        pass

# Time zone
TIME_ZONE = 'Africa/Harare'
USE_TZ = True

# Internationalization
LANGUAGE_CODE = 'en-us'
USE_I18N = True
USE_L10N = True

print(f"Production settings loaded. ALLOWED_HOSTS: {ALLOWED_HOSTS}")
print(f"Database engine: {DATABASES['default']['ENGINE']}")
print(f"CORS origins: {len(CORS_ALLOWED_ORIGINS)} configured")
