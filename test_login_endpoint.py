#!/usr/bin/env python
"""
Test Django server routing by creating a simple test endpoint
"""
import os
import sys
import django

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')
django.setup()

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["POST", "GET"])
def test_login_endpoint(request):
    """Test login endpoint that bypasses authentication"""
    print(f"Test endpoint hit - Method: {request.method}")
    print(f"Headers: {dict(request.headers)}")
    print(f"Body: {request.body}")
    
    if request.method == "POST":
        import json
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            print(f"Username: {username}, Password: {password}")
            
            # Simulate successful login
            if username == "admin" and password == "Admin@123":
                return JsonResponse({
                    'status': 'success',
                    'message': 'Test login successful',
                    'access': 'test-token-12345',
                    'user': {'username': username}
                })
            else:
                return JsonResponse({
                    'status': 'failed',
                    'message': 'Invalid test credentials'
                }, status=401)
        except Exception as e:
            print(f"Error: {e}")
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'message': 'Test endpoint working'})

if __name__ == '__main__':
    print("This is a test endpoint function")
