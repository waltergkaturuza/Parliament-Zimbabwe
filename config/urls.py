# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView # 👈 Import these
from fuel.views_main import LoginView
from django.http import JsonResponse
from django.views.generic import TemplateView

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

# JWT Token views
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('', home_view, name='home'),  # Add root URL
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