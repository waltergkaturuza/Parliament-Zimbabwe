from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework_simplejwt.tokens import RefreshToken
import json
from django.contrib.auth import get_user_model

User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def cors_bypass_login(request):
    """
    CSRF-free login endpoint for development/testing
    Returns complete user data including role for frontend routing
    """
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        print(f"DEBUG: Login attempt for username: {username}")
        
        if not username or not password:
            print("DEBUG: Missing username or password")
            return JsonResponse({
                'success': False,
                'message': 'Username and password are required'
            }, status=400)
        
        # Authenticate user
        user = authenticate(request, username=username, password=password)
        print(f"DEBUG: Authentication result: {user}")
        
        if user is not None:
            print(f"DEBUG: User authenticated successfully: {user.username}, Role: {user.role}")
            # Generate JWT tokens with custom claims
            refresh = RefreshToken.for_user(user)
            
            # Add custom claims to the refresh token
            refresh['username'] = user.username
            refresh['role'] = user.role
            refresh['user_id'] = user.id
            refresh['is_superuser'] = user.is_superuser
            if hasattr(user, 'sub_center') and user.sub_center:
                refresh['sub_center_id'] = user.sub_center.id
            
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Get user's center information
            center_id = None
            center_name = None
            if hasattr(user, 'sub_center') and user.sub_center:
                center_id = user.sub_center.id
                center_name = user.sub_center.name
            
            # Prepare complete user data for frontend
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'role': user.role,  # This is critical for frontend routing
                'is_superuser': user.is_superuser,
                'centerId': center_id,
                'centerName': center_name,
                'phone': getattr(user, 'phone', ''),
                'is_approved': getattr(user, 'is_approved', True),
                'first_name': user.first_name,
                'last_name': user.last_name,
                'permissions': []  # Add specific permissions if needed
            }
            
            print(f"DEBUG: Returning user data with role: {user_data['role']}")
            
            return JsonResponse({
                'success': True,
                'message': 'Login successful',
                'user': user_data,
                'access_token': access_token,
                'refresh_token': refresh_token
            })
        else:
            print("DEBUG: Authentication failed - invalid credentials")
            return JsonResponse({
                'success': False,
                'message': 'Invalid username or password'
            }, status=401)
            
    except json.JSONDecodeError:
        print("DEBUG: JSON decode error")
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        print(f"DEBUG: Exception occurred: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Server error: {str(e)}'
        }, status=500)
@csrf_exempt
@require_http_methods(["GET", "POST"])
def cors_test_endpoint(request):
    """
    Simple CORS test endpoint for debugging CORS issues
    """
    return JsonResponse({
        'success': True,
        'message': 'CORS test endpoint working',
        'method': request.method,
        'origin': request.META.get('HTTP_ORIGIN', 'No origin header')
    })