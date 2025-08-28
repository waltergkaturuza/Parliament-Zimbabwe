# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView # 👈 Import these
from django.http import JsonResponse
from django.views.generic import TemplateView
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from .health_check import health_check, simple_health
from api.views import health_check as api_health_check

# Import the actual LoginView for testing
def get_login_view():
    """Import LoginView directly"""
    try:
        from fuel.views_main import LoginView
        return LoginView.as_view()
    except ImportError as e:
        print(f"Error importing LoginView: {e}")
        return test_login_endpoint

# TEMPORARY TEST LOGIN ENDPOINT
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
            
            # Simulate successful login with proper JWT token
            if username == "admin" and password == "Admin@123":
                # Generate a real JWT token for testing
                from fuel.models import User
                from rest_framework_simplejwt.tokens import RefreshToken
                try:
                    user = User.objects.get(username=username)
                    refresh = RefreshToken.for_user(user)
                    
                    # Add custom claims to the access token
                    refresh['username'] = user.username
                    refresh['role'] = user.role
                    refresh['is_superuser'] = user.is_superuser
                    refresh['is_staff'] = user.is_staff
                    if user.sub_center:
                        refresh['sub_center_id'] = user.sub_center.id
                    
                    access_token = str(refresh.access_token)
                    
                    return JsonResponse({
                        'status': 'success',
                        'message': 'Test login successful',
                        'access': access_token,
                        'refresh': str(refresh),
                        'user': {
                            'username': user.username,
                            'id': user.id,
                            'role': user.role,
                            'is_superuser': user.is_superuser,
                            'is_staff': user.is_staff
                        }
                    })
                except User.DoesNotExist:
                    return JsonResponse({
                        'status': 'failed',
                        'message': 'User not found'
                    }, status=401)
            else:
                return JsonResponse({
                    'status': 'failed',
                    'message': 'Invalid test credentials'
                }, status=401)
        except Exception as e:
            print(f"Error: {e}")
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'message': 'Test endpoint working'})

# TEMPORARY DEBUG VIEW - remove after auth is fixed
@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def debug_headers_view(request):
    """Debug view that returns all headers received by Django"""
    headers = {}
    for key, value in request.META.items():
        if key.startswith('HTTP_') or key in ['CONTENT_TYPE', 'CONTENT_LENGTH']:
            headers[key] = value
    
    # Check specific auth headers
    auth_header = request.META.get('HTTP_AUTHORIZATION', 'NOT_FOUND')
    
    return JsonResponse({
        'method': request.method,
        'path': request.path,
        'headers': headers,
        'user': str(request.user) if hasattr(request, 'user') else 'No user',
        'is_authenticated': getattr(request.user, 'is_authenticated', False),
        'raw_authorization': auth_header,
        'authorization_present': 'HTTP_AUTHORIZATION' in request.META,
        'bearer_token_detected': auth_header.startswith('Bearer ') if auth_header != 'NOT_FOUND' else False,
        'token_length': len(auth_header) if auth_header != 'NOT_FOUND' else 0,
        'all_auth_like_headers': {
            k: v for k, v in request.META.items() 
            if 'auth' in k.lower() or 'token' in k.lower() or 'bearer' in str(v).lower()
        }
    }, indent=2)

def home_view(request):
    """Simple home page view"""
    return JsonResponse({
        'message': 'Parliament Fuel Coupon System API',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/v1/',
            'docs': '/api/schema/swagger-ui/'
        }
    })

@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def cors_test_view(request):
    """Test endpoint to verify CORS headers"""
    from django.conf import settings
    
    response_data = {
        'method': request.method,
        'cors_allow_all_origins': getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False),
        'cors_allowed_origins': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
        'settings_module': getattr(settings, 'SETTINGS_MODULE', 'unknown'),
        'message': 'CORS test endpoint working'
    }
    
    response = JsonResponse(response_data)
    
    # Manual CORS headers for testing
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response['Access-Control-Max-Age'] = '86400'
    
    return response

def get_jwt_token_refresh_view():
    """Lazy import to avoid circular dependency"""
    from rest_framework_simplejwt.views import TokenRefreshView
    return TokenRefreshView.as_view()

def get_jwt_token_verify_view():
    """Lazy import to avoid circular dependency"""
    from rest_framework_simplejwt.views import TokenVerifyView
    return TokenVerifyView.as_view()

urlpatterns = [
    path('', api_health_check, name='home'),  # Health check at root for Render
    path('health/', health_check, name='health-check'),  # Health check endpoint
    path('health/simple/', simple_health, name='simple-health'),  # Simple health check
    path('cors-test/', cors_test_view, name='cors-test'),  # CORS test endpoint
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Include API URLs
    # Also include fuel app URLs under /api/ as a fallback so frontend using /api/* works
    path('api/', include('fuel.urls')),
    path('api/v1/', include('fuel.urls')),
    path('api/auth/', include('fuel.urls')),  # Add direct auth path for frontend compatibility
    
    # TEMPORARY DEBUG ENDPOINT - remove after auth is fixed
    path('api/v1/debug-headers/', debug_headers_view, name='debug-headers'),
    path('api/v1/test-login/', test_login_endpoint, name='test-login'),  # TEMPORARY TEST LOGIN
    path('api/v1/custom-login/', test_login_endpoint, name='custom-login'),  # TEMPORARY CUSTOM LOGIN TEST
    path('api/v1/direct-login/', get_login_view(), name='direct-login'),  # TEST DIRECT LOGINVIEW
    
    # Business Central Integration
    path('bc/', include('fuel.urls_bc')),

    # JWT Token endpoints with lazy imports
    path('api/token/refresh/', get_jwt_token_refresh_view(), name='token_refresh'),
    path('api/token/verify/', get_jwt_token_verify_view(), name='token_verify'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # path('admin/statistics/program-summary/',
    #     ProgramViewSet.as_view({'get': 'summary'}),
    #     name='program-summary'),  # TODO: Commented out - no ProgramViewSet
]

# Serve static files (both in development and production with WhiteNoise)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # In production, WhiteNoise will handle static files, but we ensure the URL pattern exists
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)