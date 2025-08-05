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

# JWT Token views
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('', home_view, name='home'),  # Add root URL
    path('health/', health_check, name='health-check'),  # Health check endpoint
    path('health/simple/', simple_health, name='simple-health'),  # Simple health check
    path('cors-test/', cors_test_view, name='cors-test'),  # CORS test endpoint
    path('admin/', admin.site.urls),
    path('api/', home_view, name='api-home'),  # Fix the /api/ endpoint
    path('api/v1/', include('fuel.urls')),
    path('api/auth/', include('fuel.urls')),  # Add direct auth path for frontend compatibility
    
    # Business Central Integration
    path('bc/', include('fuel.urls_bc')),

    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # path('admin/statistics/program-summary/',
    #     ProgramViewSet.as_view({'get': 'summary'}),
    #     name='program-summary'),  # TODO: Commented out - no ProgramViewSet
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)