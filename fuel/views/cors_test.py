"""
Simple CORS test endpoint
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def cors_test(request):
    """
    Simple endpoint to test CORS configuration
    """
    logger.info(f"CORS Test - Method: {request.method}")
    logger.info(f"CORS Test - Origin: {request.headers.get('Origin', 'No Origin')}")
    logger.info(f"CORS Test - User-Agent: {request.headers.get('User-Agent', 'No User-Agent')}")
    
    response_data = {
        'message': 'CORS test successful',
        'method': request.method,
        'origin': request.headers.get('Origin', 'No Origin'),
        'timestamp': str(request.timestamp) if hasattr(request, 'timestamp') else 'No timestamp',
        'headers': dict(request.headers),
        'status': 'OK'
    }
    
    response = JsonResponse(response_data)
    
    # Manually add CORS headers for testing
    origin = request.headers.get('Origin')
    if origin:
        response['Access-Control-Allow-Origin'] = origin
    response['Access-Control-Allow-Credentials'] = 'true'
    response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken, X-Requested-With'
    
    logger.info(f"CORS Test - Response headers: {dict(response.items())}")
    
    return response

@csrf_exempt  
def health_check(request):
    """
    Simple health check endpoint
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'Parliament Fuel System',
        'timestamp': str(request.timestamp) if hasattr(request, 'timestamp') else 'No timestamp'
    })
