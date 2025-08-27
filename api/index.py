import os
import sys
import django
from django.conf import settings
from django.http import JsonResponse
from django.core.wsgi import get_wsgi_application

# Add the project directory to Python path
project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_dir)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')

# Initialize Django
django.setup()

# Simple Django view function
def api_handler(request):
    return JsonResponse({
        "message": "Parliament Fuel System API - Django Running",
        "status": "success",
        "version": "1.0.2",
        "framework": "Django 4.1.13"
    })

# Vercel handler
def handler(request, response):
    try:
        # Simple API response
        import json
        response_data = {
            "message": "Parliament Fuel System API - Django Ready",
            "status": "running",
            "version": "1.0.2",
            "database": "connected" if settings.DATABASES else "not configured"
        }
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({"error": str(e)})
        }

# WSGI application
application = get_wsgi_application()
