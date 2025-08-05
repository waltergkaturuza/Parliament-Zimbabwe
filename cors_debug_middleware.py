# middleware.py - Temporary debugging middleware
import logging

logger = logging.getLogger(__name__)

class CORSDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log CORS-related request details
        if request.method == 'OPTIONS' or 'auth' in request.path or 'api' in request.path:
            logger.info(f"CORS Debug - Method: {request.method}")
            logger.info(f"CORS Debug - Path: {request.path}")
            logger.info(f"CORS Debug - Origin: {request.META.get('HTTP_ORIGIN', 'None')}")
            logger.info(f"CORS Debug - Host: {request.META.get('HTTP_HOST', 'None')}")
            logger.info(f"CORS Debug - Referer: {request.META.get('HTTP_REFERER', 'None')}")
            logger.info(f"CORS Debug - User Agent: {request.META.get('HTTP_USER_AGENT', 'None')[:100]}")
        
        response = self.get_response(request)
        
        # Log response details for CORS requests
        if request.method == 'OPTIONS' or 'auth' in request.path:
            logger.info(f"CORS Debug - Response Status: {response.status_code}")
            cors_headers = {k: v for k, v in response.items() if 'cors' in k.lower() or 'access-control' in k.lower()}
            logger.info(f"CORS Debug - CORS Headers: {cors_headers}")
        
        return response
