"""
Health check views for Django application monitoring
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os


def health_check(request):
    """Basic health check endpoint"""
    try:
        # Basic checks
        health_data = {
            'status': 'healthy',
            'django_version': settings.DJANGO_VERSION if hasattr(settings, 'DJANGO_VERSION') else 'unknown',
            'debug': settings.DEBUG,
            'allowed_hosts': settings.ALLOWED_HOSTS,
            'environment_vars': {
                'DJANGO_SETTINGS_MODULE': os.environ.get('DJANGO_SETTINGS_MODULE', 'Not Set'),
                'DATABASE_HOST': os.environ.get('DATABASE_HOST', 'Not Set'),
                'DATABASE_NAME': os.environ.get('DATABASE_NAME', 'Not Set'),
                'SECRET_KEY_SET': 'Yes' if os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY') else 'No'
            }
        }
        
        return JsonResponse(health_data)
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)


@csrf_exempt
def simple_health(request):
    """Simplest possible health check"""
    return JsonResponse({'status': 'ok', 'message': 'Django is running'})
