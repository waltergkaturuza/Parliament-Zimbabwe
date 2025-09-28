"""
Django settings for config project.
"""

from pathlib import Path
from datetime import timedelta
import os
from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-1*p133x5+uzwh8&axhdhi41jq=%&p(9)pzmoyob$(a01)rcs&z')

# DEBUG mode - environment-driven for production safety
# Default to True for local development, False for production
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes', 'on')

# Print debug status for visibility
if DEBUG:
    print("DEBUG: Development mode enabled")
else:
    print("DEBUG: Production mode enabled")

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
    # Render hosts
    '.onrender.com',  # All Render subdomains
    'parliament-zimbabwe.onrender.com',  # Render backend
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

    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'corsheaders',
    'model_utils',

    'fuel.apps.FuelConfig',   # Your app
]

AUTH_USER_MODEL = 'fuel.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS must be first for proper handling
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # Re-enable CSRF protection
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CSRF settings for API - Generate range of ports for flexible development
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # Production URLs
    f"https://{FRONTEND_HOSTNAME}",  # Azure Static Web App
    f"https://{AZURE_HOSTNAME}",     # Azure App Service
    "https://jolly-ocean-0e0dee90f.2.azurestaticapps.net",  # Current frontend deployment
    "https://parliament-fuel-frontend.azurestaticapps.net",  # Alternative frontend
]

# Add range of development ports (5170-5180) for flexible Vite server allocation
for port in range(5170, 5181):
    CSRF_TRUSTED_ORIGINS.extend([
        f"http://localhost:{port}",
        f"http://127.0.0.1:{port}"
    ])

# Allow additional CSRF trusted origins via environment variable (comma-separated)
# Default to include the Render frontend origin so Render-hosted frontend passes Origin checks
ADDITIONAL_CSRF_TRUSTED_ORIGINS = os.getenv('ADDITIONAL_CSRF_TRUSTED_ORIGINS', 'https://parliament-zimbabwe-fuel.onrender.com').split(',')
ADDITIONAL_CSRF_TRUSTED_ORIGINS = [o.strip() for o in ADDITIONAL_CSRF_TRUSTED_ORIGINS if o.strip()]

for origin in ADDITIONAL_CSRF_TRUSTED_ORIGINS:
    if origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(origin)

print(f"DEBUG: CSRF_TRUSTED_ORIGINS = {CSRF_TRUSTED_ORIGINS}")

# CORS settings - Support environment variable override with flexible port range
CORS_ALLOWED_ORIGINS_BASE = [
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

# Add range of development ports (5170-5180) for flexible Vite server allocation
for port in range(5170, 5181):
    CORS_ALLOWED_ORIGINS_BASE.extend([
        f"http://localhost:{port}",  # React Vite dev server
        f"http://127.0.0.1:{port}"   # React Vite dev server
    ])

# Allow additional CORS origins from environment variable
ADDITIONAL_CORS_ORIGINS = os.getenv('ADDITIONAL_CORS_ORIGINS', '').split(',')
ADDITIONAL_CORS_ORIGINS = [origin.strip() for origin in ADDITIONAL_CORS_ORIGINS if origin.strip()]

CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_BASE + ADDITIONAL_CORS_ORIGINS

# Allow Render subdomains (safe, constrained regex) in addition to explicit origins
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.onrender\.com$",
]

CORS_ALLOW_ALL_ORIGINS = False

# Additional CORS settings for proper preflight handling
# Ensure credentials are allowed when specific origins are set
CORS_ALLOW_CREDENTIALS = True
CORS_PREFLIGHT_MAX_AGE = 86400

# More permissive CORS headers for Render deployment
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
    'cache-control',
    'pragma',
    'user-agent',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'HEAD',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_EXPOSE_HEADERS = [
    'authorization',
    'content-type',
    'x-csrftoken',
    'access-control-allow-origin',
    'access-control-allow-credentials',
]

# Ensure CORS headers are always added
CORS_ALLOWED_ORIGINS_ALL = False
CORS_ALLOW_ALL_ORIGINS = False

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
    # BASE_DIR / 'fuel-coupon-frontend' / 'dist' / 'assets',  # Only if you want Django to serve built React assets
]

# WhiteNoise settings for production static file serving
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# WhiteNoise configuration
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True

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
}

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

# Production Security Settings (only applied when DEBUG=False)
if not DEBUG:
    # HTTPS settings
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # Security headers
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    
    # HSTS settings (optional, can be enabled later)
    # SECURE_HSTS_SECONDS = 31536000
    # SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    # SECURE_HSTS_PRELOAD = True
    
    print("DEBUG: Production security settings enabled")

