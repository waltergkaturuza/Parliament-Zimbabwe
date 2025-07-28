print("TEST: Minimal settings starting")

# Absolute minimal settings
SECRET_KEY = 'test'
DEBUG = False
ALLOWED_HOSTS = []
INSTALLED_APPS = []
MIDDLEWARE = []
ROOT_URLCONF = 'config.urls'
DATABASES = {}

print("TEST: Minimal settings completed")
print("TEST: ROOT_URLCONF set to:", ROOT_URLCONF)
