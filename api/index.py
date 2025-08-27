#!/usr/bin/env python3
"""
Vercel Python serverless function entry point for Django
"""
import os
import sys
from django.core.wsgi import get_wsgi_application

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')

# Initialize Django
application = get_wsgi_application()

# Vercel handler function
def handler(request, context):
    """
    Vercel Python function handler
    """
    return application(request.environ, lambda status, headers: None)

# For WSGI compatibility
app = application
