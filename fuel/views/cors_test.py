# CORS test views for debugging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import json

@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def cors_test(request):
    """
    Simple CORS test endpoint
    """
    response_data = {
        "message": "CORS test successful",
        "method": request.method,
        "origin": request.META.get('HTTP_ORIGIN', 'No Origin'),
        "headers": dict(request.headers),
        "cors_configured": True
    }
    
    response = JsonResponse(response_data)
    
    # Add CORS headers
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
    response["Access-Control-Allow-Credentials"] = "true"
    
    return response


@csrf_exempt
@require_http_methods(["GET", "HEAD"])
def health_check(request):
    """
    Simple health check endpoint
    """
    try:
        from django.db import connection
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    health_data = {
        "status": "healthy",
        "timestamp": "2025-01-30T17:30:00Z",
        "version": "1.0.0",
        "database": db_status,
        "debug": settings.DEBUG,
        "allowed_hosts": settings.ALLOWED_HOSTS[:3],  # Only show first 3 for security
    }
    
    return JsonResponse(health_data, status=200)