#!/usr/bin/env python3
"""
Debug view to see what headers Django receives from the frontend
"""
import os
import sys
import django
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')

# Setup Django
django.setup()

@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def debug_headers(request):
    """
    Debug view that returns all headers received by Django
    """
    headers = {}
    for key, value in request.META.items():
        if key.startswith('HTTP_') or key in ['CONTENT_TYPE', 'CONTENT_LENGTH']:
            headers[key] = value
    
    return JsonResponse({
        'method': request.method,
        'path': request.path,
        'headers': headers,
        'user': str(request.user) if hasattr(request, 'user') else 'No user',
        'is_authenticated': getattr(request.user, 'is_authenticated', False),
        'raw_authorization': request.META.get('HTTP_AUTHORIZATION', 'NOT_FOUND'),
        'all_auth_like_headers': {
            k: v for k, v in request.META.items() 
            if 'auth' in k.lower() or 'token' in k.lower() or 'bearer' in str(v).lower()
        }
    }, indent=2)

if __name__ == "__main__":
    print("Debug headers view created. Add to URLs to test.")
