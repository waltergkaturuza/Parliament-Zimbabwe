from django.http import JsonResponse
from django.urls import path, include
from django.contrib import admin

def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'Django is running',
        'settings_module': 'test_settings'
    })

def cors_test(request):
    response = JsonResponse({
        'status': 'success',
        'message': 'CORS test endpoint working',
        'method': request.method
    })
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health'),
    path('api/health/', health_check, name='api_health'),
    path('api/cors-test/', cors_test, name='cors_test'),
    path('', health_check, name='root'),
]
