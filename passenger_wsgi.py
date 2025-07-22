#!/usr/bin/python3
import sys
import os

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Set the Django settings module for cPanel
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.cpanel'

# Import Django and configure
import django
django.setup()

# Import the Django WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
