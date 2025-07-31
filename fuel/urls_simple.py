# fuel/urls_simple.py - Simplified URLs for debugging startup issues
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# Import basic views that should exist
try:
    from .views_main import LoginView, RegisterView, UserViewSet
    MAIN_VIEWS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import main views: {e}")
    MAIN_VIEWS_AVAILABLE = False

# Simple health check view
@csrf_exempt
def simple_health_check(request):
    return JsonResponse({
        "status": "ok",
        "message": "Backend is running",
        "main_views_available": MAIN_VIEWS_AVAILABLE
    })

# Simple login endpoint for testing
@csrf_exempt
def simple_login_test(request):
    return JsonResponse({
        "endpoint": "login",
        "method": request.method,
        "available": MAIN_VIEWS_AVAILABLE
    })

# Create router with minimal ViewSets
router = DefaultRouter()

if MAIN_VIEWS_AVAILABLE:
    router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Basic health check
    path('health/', simple_health_check, name='simple-health'),
    path('api/health/', simple_health_check, name='api-health'),
    
    # Router URLs (if available)
    path('', include(router.urls)),
]

# Add authentication URLs if views are available
if MAIN_VIEWS_AVAILABLE:
    urlpatterns += [
        path('auth/login/', LoginView.as_view(), name='login'),
        path('auth/register/', RegisterView.as_view(), name='register'),
    ]
else:
    urlpatterns += [
        path('auth/login/', simple_login_test, name='login-test'),
        path('auth/register/', simple_login_test, name='register-test'),
    ]

print(f"URLs loaded with MAIN_VIEWS_AVAILABLE: {MAIN_VIEWS_AVAILABLE}")
print(f"Total URL patterns: {len(urlpatterns)}")
