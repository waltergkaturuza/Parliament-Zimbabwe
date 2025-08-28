"""
Django settings for config project.
"""

from pathlib import Path
from datetime import timedelta
import os
from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-1*p133x5+uzwh8&axhdhi41jq=%&p(9)pzmoyob$(a01)rcs&z')

# Force DEBUG mode to True for local development
DEBUG = True
print(f"DEBUG: Forced DEBUG to True for local development")

# Azure-specific hostname configuration
AZURE_HOSTNAME = os.environ.get('AZURE_HOSTNAME', 'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net')
FRONTEND_HOSTNAME = os.environ.get('FRONTEND_HOSTNAME', 'jolly-ocean-0e0dee90f.2.azurestaticapps.net')

ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    '0.0.0.0',  # Allow all interfaces for local development
    AZURE_HOSTNAME,  # Actual Azure hostname
    'parliament-fuel-system.azurewebsites.net',  # Alternative hostname
    '169.254.131.3',  # Azure internal health check IP
    '169.254.131.1',  # Azure internal load balancer IP
    '169.254.131.2',  # Azure internal services IP
    '169.254.131.4',  # Additional Azure internal IP
    '169.254.131.7',  # Additional Azure internal IP
    '169.254.130.5',  # Azure internal IP from logs
    '169.254.130.7',  # Azure internal IP from logs
    '169.254.130.1',  # Additional Azure internal range
    '169.254.130.10', # Additional Azure internal range
    # New Azure internal IPs from deployment logs
    '169.254.131.9',  # From deployment error logs
    '169.254.131.10', # From deployment error logs
]

# For local development, allow all hosts if DEBUG is True
if DEBUG:
    ALLOWED_HOSTS.append('*')

# For local development, allow all hosts if DEBUG is True
if DEBUG:
    ALLOWED_HOSTS = ['*']

# Add environment variable support for additional hosts
if os.environ.get('DJANGO_ALLOWED_HOSTS'):
    additional_hosts = [h.strip() for h in os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')]
    ALLOWED_HOSTS.extend(additional_hosts)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'django_extensions',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'corsheaders',
    'model_utils',

    'fuel.apps.FuelConfig',   # Your app
    'dynamics_integration.apps.DynamicsIntegrationConfig',  # Dynamics 365 Integration
]

AUTH_USER_MODEL = 'fuel.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS must be first for proper handling
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # Re-enable CSRF protection
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CSRF settings for API
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
    # Production URLs
    f"https://{FRONTEND_HOSTNAME}",  # Azure Static Web App
    f"https://{AZURE_HOSTNAME}",     # Azure App Service
    "https://jolly-ocean-0e0dee90f.2.azurestaticapps.net",  # Current frontend deployment
    "https://parliament-fuel-frontend.azurestaticapps.net",  # Alternative frontend
]

# CORS settings
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
    # Production URLs
    f"https://{FRONTEND_HOSTNAME}",  # Azure Static Web App
    f"https://{AZURE_HOSTNAME}",     # Azure App Service
    "https://jolly-ocean-0e0dee90f.2.azurestaticapps.net",  # Current frontend deployment
    "https://parliament-fuel-frontend.azurestaticapps.net",  # Alternative frontend
    # Add alternative backend URLs that might be referenced
    "https://parliament-fuel-system.azurewebsites.net",  # Alternative backend URL
    # Render Frontend URLs
    "https://parliament-zimbabwe-fuel.onrender.com",  # Render frontend deployment
]

# Additional CORS settings for proper preflight handling
CORS_ALLOW_ALL_ORIGINS = False  # MUST be False when allowing credentials
CORS_ALLOW_CREDENTIALS = True
CORS_REPLACE_HTTPS_REFERER = True  # Important for Azure deployments
CORS_PREFLIGHT_MAX_AGE = 86400
CORS_ALLOW_HEADERS = list(default_headers) + [
    'authorization',
    'content-type',
    'x-csrftoken',
    'x-requested-with',
    'accept',
    'accept-encoding',
    'accept-language',
    'access-control-request-headers',
    'access-control-request-method',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_EXPOSE_HEADERS = [
    'authorization',
    'content-type',
    'x-csrftoken',
]

# Debug CORS configuration
print(f"DEBUG: CORS_ALLOWED_ORIGINS = {CORS_ALLOWED_ORIGINS}")
print(f"DEBUG: CORS_ALLOW_ALL_ORIGINS = {CORS_ALLOW_ALL_ORIGINS}")
print(f"DEBUG: FRONTEND_HOSTNAME = {FRONTEND_HOSTNAME}")
print(f"DEBUG: DEBUG mode = {DEBUG}")

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database Configuration - Support both local and Azure
import dj_database_url

# Check if we're on Azure (using DATABASE_URL) or local development
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # Azure/Production PostgreSQL configuration
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=True)
    }
    print("DEBUG: Using Azure PostgreSQL database")
else:
    # Local development SQLite configuration
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    print("DEBUG: Using SQLite database for local development")

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Harare'
USE_I18N = True
USE_TZ = True

# Static files for local & production (adjust as needed)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'fuel-coupon-frontend' / 'dist' / 'assets',  # Only if you want Django to serve built React assets
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # Use this for all JWT APIs
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',

    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    # Sliding tokens can be enabled if you want (for refresh by usage)
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Fuel Coupon System API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'displayOperationId': False,
        'filter': True,
    },
    'SECURITY': [
        {
            'bearerAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
        }
    ],
    'SECURITY_DEFINITIONS': {
        'bearerAuth': {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Bearer JWT authentication',
        }
    },
}

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    # Add additional auth backends if needed (e.g., AzureAD)
]

# Logging (optional but highly recommended for debugging)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'django.request': {
        'handlers': ['console'],
        'level': 'ERROR',
        'propagate': False,
    },
    'django.db.backends': {
        'handlers': ['console'],
        'level': 'ERROR',
        'propagate': False,
    },
    'dynamics_integration': {
        'handlers': ['console'],
        'level': 'INFO',
        'propagate': False,
    },
}

# Microsoft Dynamics 365 Business Central Integration Settings
# Parliament of Zimbabwe - Actual Credentials
DYNAMICS_BC_URL = os.getenv('DYNAMICS_BC_URL', 'https://api.businesscentral.dynamics.com/v2.0/086c4475-d0ef-4d2b-871c-4e078a083db5/Production/ODataV4/')
DYNAMICS_TENANT_ID = os.getenv('DYNAMICS_TENANT_ID', '086c4475-d0ef-4d2b-871c-4e078a083db5')
DYNAMICS_CLIENT_ID = os.getenv('DYNAMICS_CLIENT_ID', 'c26c60eb-f154-40eb-b02e-f3997e083316')
DYNAMICS_CLIENT_SECRET = os.getenv('DYNAMICS_CLIENT_SECRET', 'us18Q~TnKoQ5hYlKNtIAweLGoTdqX7kSdvFTIcI1')

# Authentication settings
DYNAMICS_AUTH_SCOPE = 'https://api.businesscentral.dynamics.com/.default'
DYNAMICS_AUTH_URL = f'https://login.microsoftonline.com/{DYNAMICS_TENANT_ID}/oauth2/v2.0/token'

# Sync settings
DYNAMICS_SYNC_ENABLED = os.getenv('DYNAMICS_SYNC_ENABLED', 'True').lower() == 'true'
DYNAMICS_BATCH_SIZE = int(os.getenv('DYNAMICS_BATCH_SIZE', '100'))
DYNAMICS_RETRY_ATTEMPTS = int(os.getenv('DYNAMICS_RETRY_ATTEMPTS', '3'))

# Email Settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'noreply@parliament.gov.zw')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'Parliament Fuel System <noreply@parliament.gov.zw>')
EMAIL_SUBJECT_PREFIX = '[Parliament Fuel System] '

# For development, you can use console backend to see emails in console
if DEBUG and not os.getenv('EMAIL_HOST_PASSWORD'):
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

