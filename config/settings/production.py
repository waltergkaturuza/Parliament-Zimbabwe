# Production Django Settings for Azure
import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Azure App Service settings
ALLOWED_HOSTS = [
    'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net',
    'parliament-fuel-system.azurewebsites.net',
    'fuel.parliament.gov.zw',
    'localhost',  # For local testing
]

# Database - Azure PostgreSQL
if os.environ.get('DB_PASSWORD'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'postgres'),
            'USER': os.environ.get('DB_USER', 'yekrzopkqr'),
            'PASSWORD': os.environ.get('DB_PASSWORD'),
            'HOST': os.environ.get('DB_HOST', 'parliament-fuel-postgres.postgres.database.azure.com'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'OPTIONS': {
                'sslmode': 'require',
            },
        }
    }
else:
    # Fallback to SQLite for initial testing
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Azure Key Vault for secrets
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY') or 'fallback-secret-key-for-development-only'

# Business Central Settings (Production)
BUSINESS_CENTRAL_CONFIG = {
    'tenant_id': os.environ.get('BC_TENANT_ID'),
    'client_id': os.environ.get('BC_CLIENT_ID'),
    'client_secret': os.environ.get('BC_CLIENT_SECRET'),
    'environment': os.environ.get('BC_ENVIRONMENT', 'Production'),
    'company_id': os.environ.get('BC_COMPANY_ID'),
    'base_url': os.environ.get('BC_BASE_URL'),
    'api_version': 'v2.0',
}

# Azure Application Insights (optional)
if os.environ.get('APPINSIGHTS_INSTRUMENTATIONKEY'):
    try:
        import applicationinsights.django
        INSTALLED_APPS += [
            'applicationinsights.django',
        ]
        
        APPLICATION_INSIGHTS = {
            'ikey': os.environ.get('APPINSIGHTS_INSTRUMENTATIONKEY'),
            'use_view_name': True,
            'record_view_arguments': True,
        }

        MIDDLEWARE = [
            'applicationinsights.django.ApplicationInsightsMiddleware',
        ] + MIDDLEWARE
    except ImportError:
        pass  # Application Insights not available

# Email Configuration - Azure/Office 365
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('SMTP_HOST', 'smtp.office365.com')
EMAIL_PORT = int(os.environ.get('SMTP_PORT', '587'))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('SMTP_USER')
EMAIL_HOST_PASSWORD = os.environ.get('SMTP_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('SMTP_USER', 'fuel-system@parliament.gov.zw')

# Static files (CSS, JavaScript, Images) - Azure Storage
if os.environ.get('AZURE_STORAGE_ACCOUNT_NAME'):
    INSTALLED_APPS += ['storages']
    
    DEFAULT_FILE_STORAGE = 'storages.backends.azure_storage.AzureStorage'
    STATICFILES_STORAGE = 'storages.backends.azure_storage.AzureStorage'
    
    AZURE_ACCOUNT_NAME = os.environ.get('AZURE_STORAGE_ACCOUNT_NAME')
    AZURE_ACCOUNT_KEY = os.environ.get('AZURE_STORAGE_ACCOUNT_KEY')
    AZURE_CONTAINER = os.environ.get('AZURE_STORAGE_CONTAINER', 'static')
    AZURE_CUSTOM_DOMAIN = f'{AZURE_ACCOUNT_NAME}.blob.core.windows.net'
    
    STATIC_URL = f'https://{AZURE_CUSTOM_DOMAIN}/{AZURE_CONTAINER}/'
    MEDIA_URL = f'https://{AZURE_CUSTOM_DOMAIN}/media/'
else:
    # Fallback to local storage
    STATIC_URL = '/static/'
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_REDIRECT_EXEMPT = []
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'

# Logging configuration (Azure-compatible)
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
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
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
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Cache configuration - Azure Redis (optional)
if os.environ.get('REDIS_URL'):
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': os.environ.get('REDIS_URL'),
        }
    }

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 3600 * 8  # 8 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# CSRF settings
CSRF_TRUSTED_ORIGINS = [
    'https://fuel.parliament.gov.zw',
    'https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net',
    'https://parliament-fuel-system.azurewebsites.net',
]

# Time zone
TIME_ZONE = 'Africa/Harare'
USE_TZ = True

# Internationalization
LANGUAGE_CODE = 'en-us'
USE_I18N = True
USE_L10N = True
