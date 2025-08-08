# Production Django Settings for Azure
import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

print("[PRODUCTION SETTINGS] Using config/settings/production.py file")
print(f"[PRODUCTION SETTINGS] DEBUG_PRODUCTION_ISSUES will be checked")

# Print Django version and environment
import django
print(f"[PRODUCTION SETTINGS] Django version: {django.get_version()}")
print(f"[PRODUCTION SETTINGS] Python environment variables loaded")

# Override MIDDLEWARE to enable proper CORS handling
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # Re-enable CSRF protection
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'auth.middleware.RequestLoggingMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

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
    # ALLOWED_HOSTS - Use the ACTUAL deployment URL
    ALLOWED_HOSTS = [
        'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net',  # ACTUAL BACKEND URL
        'parliament-fuel-system.azurewebsites.net',  # Custom domain (if configured)
        'jolly-ocean-0e0dee90f.2.azurestaticapps.net',
        'fuel.parliament.gov.zw',
        'parliament.gov.zw',
        # Azure internal network IPs
        '169.254.130.5',  # Azure internal load balancer
        '169.254.130.7',  # Azure internal middleware
        '169.254.131.2',  # Azure container internal IPs
        '169.254.131.4',
        '169.254.131.5',
        '169.254.131.6',
        '169.254.131.7',
        'localhost',
        '127.0.0.1',
    ]
    print(f"[DEBUG] Using default ALLOWED_HOSTS: {ALLOWED_HOSTS}")
logging.basicConfig(level=logging.INFO)
logging.info(f"[Startup] ALLOWED_HOSTS: {ALLOWED_HOSTS}")

# Database - Azure PostgreSQL (NO SQLite fallback in production)
import dj_database_url

# Priority: Use individual environment variables if available (better for Azure PostgreSQL)
# These avoid URL encoding issues with usernames containing @ symbol
db_name = os.environ.get('DATABASE_NAME') or os.environ.get('DB_NAME')
db_user = os.environ.get('DATABASE_USER') or os.environ.get('DB_USER')
db_password = os.environ.get('DATABASE_PASSWORD') or os.environ.get('DB_PASSWORD')
db_host = os.environ.get('DATABASE_HOST') or os.environ.get('DB_HOST')
db_port = os.environ.get('DATABASE_PORT') or os.environ.get('DB_PORT', '5432')

# Check if individual variables are available (preferred for Azure)
if all([db_name, db_user, db_password, db_host]):               
    print(f"[DEBUG] Using individual environment variables")
    print(f"[DEBUG] DB_NAME: {db_name}")
    print(f"[DEBUG] DB_USER: {db_user}")
    print(f"[DEBUG] DB_HOST: {db_host}")
    
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
                # Additional connection options for stability
                'connect_timeout': 10,
                'application_name': 'parliament-fuel-system',
            },
        }
    }
# Fallback to DATABASE_URL if individual variables not available
elif os.environ.get('DATABASE_URL'):
    DATABASES = {
        "default": dj_database_url.config(
            default=os.environ.get("DATABASE_URL")
        )
    }
    print(f"[DEBUG] Using DATABASE_URL connection")
else:
    # This should never happen in production
    raise ValueError(
        "Missing required database environment variables. "
        "Set DATABASE_URL or all of: DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST"
    )

# Debug database configuration
print(f"[DEBUG] Final DATABASES config:")
print(f"[DEBUG] ENGINE: {DATABASES['default']['ENGINE']}")
print(f"[DEBUG] NAME: {DATABASES['default']['NAME']}")
print(f"[DEBUG] USER: {DATABASES['default']['USER']}")
print(f"[DEBUG] HOST: {DATABASES['default']['HOST']}")
print(f"[DEBUG] PORT: {DATABASES['default']['PORT']}")

# Azure Key Vault for secrets
_env_secret_key = os.environ.get('SECRET_KEY')
_django_secret_key = os.environ.get('DJANGO_SECRET_KEY')

print(f"[DEBUG] DJANGO_SECRET_KEY: {_django_secret_key}")
print(f"[DEBUG] SECRET_KEY: {_env_secret_key}")

# Use the full SECRET_KEY from environment, preferring SECRET_KEY over DJANGO_SECRET_KEY
if _env_secret_key and _env_secret_key.strip():
    SECRET_KEY = _env_secret_key.strip()
    print('[DEBUG] Using SECRET_KEY environment variable')
elif _django_secret_key and _django_secret_key.strip():
    SECRET_KEY = _django_secret_key.strip()
    print('[DEBUG] Using DJANGO_SECRET_KEY environment variable')
else:
    print('[DEBUG] No valid SECRET_KEY found! Using secure fallback.')
    SECRET_KEY = 'django-insecure-fallback-key-for-production-emergency-only-please-set-proper-secret-key-12345678901234567890'
    logging.error('[Startup] SECRET_KEY is missing or empty!')

# Validate SECRET_KEY is not empty and is long enough
if not SECRET_KEY or len(SECRET_KEY) < 20:
    SECRET_KEY = 'django-insecure-emergency-fallback-key-for-production-emergency-only-1234567890abcdefghij'
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

# CSRF settings - Must match frontend URL
CSRF_TRUSTED_ORIGINS = [
    'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',  # Current frontend
    'https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net',  # ACTUAL BACKEND URL
    'https://fuel.parliament.gov.zw',
    'https://parliament.gov.zw',
]

# CORS settings - Fixed for production
CORS_ALLOWED_ORIGINS = [
    'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',  # Current frontend
    'https://fuel.parliament.gov.zw',
    'https://parliament.gov.zw',
]

# Site URL - Use the ACTUAL DEPLOYED backend URL
SITE_URL = 'https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net'

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # MUST be False when allowing credentials
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

# X-Frame-Options for BC iframe embedding
X_FRAME_OPTIONS = 'SAMEORIGIN'

# Debug CORS issues - Fixed configuration
DEBUG_PRODUCTION_ISSUES = os.environ.get('DEBUG_PRODUCTION_ISSUES', 'True').lower() == 'true'
if DEBUG_PRODUCTION_ISSUES:
    # Enable debug logging but keep CORS secure
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOW_CREDENTIALS = True
    LOGGING['root']['level'] = 'DEBUG'
    LOGGING['loggers']['django']['level'] = 'DEBUG' 
    LOGGING['loggers']['fuel']['level'] = 'DEBUG'
    print("[DEBUG] CORS debugging enabled with secure configuration")
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOW_CREDENTIALS = True

# Time zone
TIME_ZONE = 'Africa/Harare'
USE_TZ = True

# Internationalization
LANGUAGE_CODE = 'en-us'
USE_I18N = True
USE_L10N = True
