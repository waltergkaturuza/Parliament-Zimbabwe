"""
Django settings for config project.
"""

from pathlib import Path
from datetime import timedelta
import os
from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-1*p133x5+uzwh8&axhdhi41jq=%&p(9)pzmoyob$(a01)rcs&z')
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

# Azure-specific hostname configuration
AZURE_HOSTNAME = 'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net'
FRONTEND_HOSTNAME = 'jolly-ocean-0e0dee90f.2.azurestaticapps.net'

ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost', 
    'parliament-fuel-system.azurewebsites.net',  # Original planned hostname
    AZURE_HOSTNAME,  # Actual Azure hostname
]

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
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS should be as high as possible!
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CSRF settings for API
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # Production URLs
    f"https://{FRONTEND_HOSTNAME}",  # Azure Static Web App
    f"https://{AZURE_HOSTNAME}",     # Azure App Service
    "https://parliament-fuel-system.azurewebsites.net",  # Original planned hostname
]

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # React Vite dev server
    "http://localhost:5174",  # Alternative Vite port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:8000",  # Django backend
    "http://127.0.0.1:8000",  # Django backend
    # Production URLs
    f"https://{FRONTEND_HOSTNAME}",  # Azure Static Web App
    f"https://{AZURE_HOSTNAME}",     # Azure App Service
    "https://parliament-fuel-system.azurewebsites.net",  # Original planned hostname
]
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
# Allow all methods for development
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Only in development
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
# Additional CORS settings for development
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours
CORS_EXPOSE_HEADERS = [
    'authorization',
    'content-type',
    'x-csrftoken',
]

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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Override with PostgreSQL if environment variables are set
if os.environ.get('DATABASE_URL'):
    import dj_database_url
    DATABASES['default'] = dj_database_url.parse(os.environ.get('DATABASE_URL'))
elif os.environ.get('DATABASE_NAME'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DATABASE_NAME', 'fuel_db'),
            'USER': os.environ.get('DATABASE_USER', 'postgres'),
            'PASSWORD': os.environ.get('DATABASE_PASSWORD', 'katuruza'),
            'HOST': os.environ.get('DATABASE_HOST', 'localhost'),
            'PORT': os.environ.get('DATABASE_PORT', '5432'),
        }
    }

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

