# CORS Test Views - Direct HTTP responses bypassing Django middleware
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
import json

@csrf_exempt
def cors_bypass_login(request):
    """Login endpoint that completely bypasses Django CORS middleware"""
    
    # Handle OPTIONS request manually
    if request.method == 'OPTIONS':
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
        response['Access-Control-Max-Age'] = '86400'
        response.status_code = 200
        return response
    
    # Handle POST request
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            username = data.get('username')
            password = data.get('password')
            
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                response_data = {
                    'access': access_token,
                    'refresh': refresh_token,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'role': getattr(user, 'role', 'user')
                    }
                }
                
                response = JsonResponse(response_data)
                response['Access-Control-Allow-Origin'] = '*'
                response['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
                response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
                response.status_code = 200
                return response
            else:
                response = JsonResponse({'detail': 'Invalid credentials'})
                response['Access-Control-Allow-Origin'] = '*'
                response['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
                response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
                response.status_code = 401
                return response
                
        except json.JSONDecodeError:
            response = JsonResponse({'detail': 'Invalid JSON'})
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
            response.status_code = 400
            return response
    
    # Handle other methods
    response = JsonResponse({'detail': 'Method not allowed'})
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
    response.status_code = 405
    return response

@csrf_exempt
def cors_test_endpoint(request):
    """Simple test endpoint to verify CORS"""
    response_data = {
        'method': request.method,
        'message': 'CORS test working',
        'headers': dict(request.headers)
    }
    
    response = JsonResponse(response_data)
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
    response['Access-Control-Max-Age'] = '86400'
    
    if request.method == 'OPTIONS':
        response.status_code = 200
    
    return response
