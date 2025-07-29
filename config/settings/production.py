# Production Django Settings for Azure
import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Print all environment variables at startup for debug
import logging
print("[DEBUG] All environment variables:")
for k, v in os.environ.items():
    print(f"[DEBUG] ENV {k} = {v}")

# ALLOWED_HOSTS - Read from DJANGO_ALLOWED_HOSTS or ALLOWED_HOSTS
_env_allowed_hosts = os.environ.get('DJANGO_ALLOWED_HOSTS') or os.environ.get('ALLOWED_HOSTS')
print(f"[DEBUG] DJANGO_ALLOWED_HOSTS: {os.environ.get('DJANGO_ALLOWED_HOSTS')}")
print(f"[DEBUG] ALLOWED_HOSTS: {os.environ.get('ALLOWED_HOSTS')}")
if _env_allowed_hosts:
    ALLOWED_HOSTS = [h.strip() for h in _env_allowed_hosts.split(',') if h.strip()]
    print(f"[DEBUG] Parsed ALLOWED_HOSTS from env: {ALLOWED_HOSTS}")
else:
    ALLOWED_HOSTS = [
        'parliament-fuel-system.azurewebsites.net',  # Correct production URL
        'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net',  # Current deployment
        'fuel.parliament.gov.zw',
        'parliament.gov.zw',
        'localhost',  # For local testing
        '127.0.0.1',  # For local testing
    ]
    print(f"[DEBUG] Using default ALLOWED_HOSTS: {ALLOWED_HOSTS}")
logging.basicConfig(level=logging.INFO)
logging.info(f"[Startup] ALLOWED_HOSTS: {ALLOWED_HOSTS}")

# Database - Azure PostgreSQL (NO SQLite fallback in production)
import dj_database_url

# First try DATABASE_URL (preferred method)
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        "default": dj_database_url.config(
            default=os.environ.get("DATABASE_URL")
        )
    }
    print(f"[DEBUG] Using DATABASE_URL connection")
else:
    # Use individual environment variables
    # These MUST be set in Azure App Service configuration
    db_name = os.environ.get('DATABASE_NAME') or os.environ.get('DB_NAME')
    db_user = os.environ.get('DATABASE_USER') or os.environ.get('DB_USER')
    db_password = os.environ.get('DATABASE_PASSWORD') or os.environ.get('DB_PASSWORD')
    db_host = os.environ.get('DATABASE_HOST') or os.environ.get('DB_HOST')
    db_port = os.environ.get('DATABASE_PORT') or os.environ.get('DB_PORT', '5432')
    
    print(f"[DEBUG] DB_NAME: {db_name}")
    print(f"[DEBUG] DB_USER: {db_user}")
    print(f"[DEBUG] DB_HOST: {db_host}")
    
    if not all([db_name, db_user, db_password, db_host]):
        raise ValueError(
            "Missing required database environment variables. "
            "Set DATABASE_URL or all of: DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST"
        )
    
    # Format username for Azure PostgreSQL (user@server format)
    if '@' not in db_user and 'azure.com' in db_host:
        server_name = db_host.split('.')[0]  # Extract server name from FQDN
        db_user = f"{db_user}@{server_name}"
        print(f"[DEBUG] Using Azure PostgreSQL user format: {db_user}")
    
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name,
            'USER': db_user,
            'PASSWORD': db_password,
            'HOST': db_host,
            'PORT': db_port,
            'OPTIONS': {
                'sslmode': 'require',  # Required for Azure PostgreSQL
            },
        }
    }

# Debug database configuration
print(f"[DEBUG] Final DATABASES config:")
print(f"[DEBUG] ENGINE: {DATABASES['default']['ENGINE']}")
print(f"[DEBUG] NAME: {DATABASES['default']['NAME']}")
print(f"[DEBUG] USER: {DATABASES['default']['USER']}")
print(f"[DEBUG] HOST: {DATABASES['default']['HOST']}")
print(f"[DEBUG] PORT: {DATABASES['default']['PORT']}")

# Azure Key Vault for secrets
_env_secret_key = os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY')
print(f"[DEBUG] DJANGO_SECRET_KEY: {os.environ.get('DJANGO_SECRET_KEY')}")
print(f"[DEBUG] SECRET_KEY: {os.environ.get('SECRET_KEY')}")
print(f"[DEBUG] Environment SECRET_KEY present: {bool(_env_secret_key)}")
print(f"[DEBUG] Environment SECRET_KEY length: {len(_env_secret_key) if _env_secret_key else 0}")

# Ensure SECRET_KEY is never empty
if _env_secret_key and _env_secret_key.strip():
    SECRET_KEY = _env_secret_key.strip()
    print(f'[DEBUG] Using environment SECRET_KEY')
else:
    print('[DEBUG] SECRET_KEY is missing or empty! Using fallback.')
    SECRET_KEY = 'fallback-key-for-emergency-only-not-secure-django-insecure-1234567890'
    logging.error('[Startup] SECRET_KEY is missing or empty!')

# Validate SECRET_KEY is not empty
if not SECRET_KEY:
    SECRET_KEY = 'emergency-fallback-key-for-development-only-1234567890abcdef'
    print('[DEBUG] Emergency fallback SECRET_KEY applied!')

# Log SECRET_KEY length and first/last chars for debug (never log full key)
print(f"[DEBUG] Final SECRET_KEY length: {len(SECRET_KEY)}")
logging.info(f"[Startup] SECRET_KEY: length={len(SECRET_KEY)}, startswith={SECRET_KEY[:4]}, endswith={SECRET_KEY[-4:]}")

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

# Azure Application Insights
# Use the instrumentation key from your Azure portal
APPINSIGHTS_INSTRUMENTATIONKEY = '8653e7a8-b8cc-497b-8ad8-ec60ed4bd8ef'
APPINSIGHTS_CONNECTION_STRING = 'InstrumentationKey=8653e7a8-b8cc-497b-8ad8-ec60ed4bd8ef;IngestionEndpoint=https://southafricanorth-1.in.applicationinsights.azure.com/;LiveEndpoint=https://southafricanorth.livediagnostics.monitor.azure.com/;ApplicationId=b2c382b6-39f8-4d2d-a1da-66534477ad50'

# Configure Application Insights for better monitoring
if APPINSIGHTS_INSTRUMENTATIONKEY:
    try:
        import applicationinsights.django
        INSTALLED_APPS += [
            'applicationinsights.django',
        ]
        
        APPLICATION_INSIGHTS = {
            'ikey': APPINSIGHTS_INSTRUMENTATIONKEY,
            'use_view_name': True,
            'record_view_arguments': True,
            'record_dependency_data': True,
        }

        MIDDLEWARE = [
            'applicationinsights.django.ApplicationInsightsMiddleware',
        ] + MIDDLEWARE
        
        # Define LOGGING configuration if not already defined
        if 'LOGGING' not in globals():
            LOGGING = {
                'version': 1,
                'disable_existing_loggers': False,
                'handlers': {
                    'console': {
                        'class': 'logging.StreamHandler',
                    },
                },
                'loggers': {
                    'django': {
                        'handlers': ['console'],
                        'level': 'INFO',
                    },
                    'fuel': {
                        'handlers': ['console'],
                        'level': 'INFO',
                    },
                },
            }
        
        # Enhanced logging for production debugging
        LOGGING['handlers']['appinsights'] = {
            'class': 'applicationinsights.django.LoggingHandler',
            'level': 'WARNING',
        }
        LOGGING['loggers']['django']['handlers'].append('appinsights')
        LOGGING['loggers']['fuel']['handlers'].append('appinsights')
        
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

# Security settings for production (Azure App Service compatible)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Azure App Service handles HTTPS termination, so we need to be careful with SSL settings
# Only enable HSTS and SSL redirect if we have a custom domain with proper SSL setup
USE_HTTPS = os.environ.get('USE_HTTPS', 'False').lower() == 'true'

if USE_HTTPS:
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
else:
    # For Azure App Service without custom domain, disable SSL redirect to prevent loops
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    print("[DEBUG] SSL redirect disabled for Azure App Service compatibility")

SECURE_REDIRECT_EXEMPT = []
X_FRAME_OPTIONS = 'DENY'

# Trust the Azure load balancer's headers for HTTPS detection
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

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

# CSRF settings - Must match CORS origins
CSRF_TRUSTED_ORIGINS = [
    'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',  # Current frontend deployment
    'https://parliament-fuel-frontend.azurestaticapps.net',
    'https://fuel.parliament.gov.zw',
    'https://parliament.gov.zw',
    'https://parliament-fuel-system.azurewebsites.net',  # Correct backend URL
    'https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net',  # Current deployment
]

# CORS settings for production - More permissive for debugging
CORS_ALLOWED_ORIGINS = [
    'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',  # Current frontend deployment
    'https://parliament-fuel-frontend.azurestaticapps.net',
    'https://fuel.parliament.gov.zw',
    'https://parliament.gov.zw',
    'http://localhost:3000',  # For local development
    'http://127.0.0.1:3000',  # For local development
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Keep this False for security
CORS_PREFLIGHT_MAX_AGE = 86400  # 1 day

# More comprehensive CORS headers
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
    'x-forwarded-for',
    'x-forwarded-proto',
    'access-control-allow-origin',
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

# Additional CORS settings for better compatibility
CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
    'access-control-allow-origin',
    'access-control-allow-credentials',
]

# Business Central Integration Settings
BC_INTEGRATION_ENABLED = os.environ.get('BC_INTEGRATION_ENABLED', 'True').lower() == 'true'
BC_WEBHOOK_SECRET = os.environ.get('BC_WEBHOOK_SECRET', 'change-this-in-production')
BC_API_TIMEOUT = 30  # seconds

# Site URL for absolute URLs - Use the correct backend URL
SITE_URL = 'https://parliament-fuel-system.azurewebsites.net'

# X-Frame-Options for BC iframe embedding
X_FRAME_OPTIONS = 'SAMEORIGIN'

# Debug CORS issues and enable detailed logging for troubleshooting
DEBUG_PRODUCTION_ISSUES = os.environ.get('DEBUG_PRODUCTION_ISSUES', 'True').lower() == 'true'
if DEBUG_PRODUCTION_ISSUES:
    # Temporarily allow all origins for debugging
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = []  # Clear specific origins when allowing all
    
    MIDDLEWARE.insert(1, 'utils.cors_debug.CORSDebugMiddleware')
    # Enable more detailed logging for production debugging
    LOGGING['root']['level'] = 'DEBUG'
    LOGGING['loggers']['django']['level'] = 'DEBUG'
    LOGGING['loggers']['fuel']['level'] = 'DEBUG'

# Time zone
TIME_ZONE = 'Africa/Harare'
USE_TZ = True

# Internationalization
LANGUAGE_CODE = 'en-us'
USE_I18N = True
USE_L10N = True
