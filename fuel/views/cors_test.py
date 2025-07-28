"""
CORS testing views
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def cors_test(request):
    """Simple CORS test endpoint"""
    return JsonResponse({
        'message': 'CORS test successful',
        'method': request.method,
        'status': 'ok'
    })


@csrf_exempt
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'Django backend is running'
    })
