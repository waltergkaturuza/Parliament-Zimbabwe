# config/cors_debug.py
import logging

logger = logging.getLogger('cors_debug')

class CorsDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log CORS-related request information
        origin = request.META.get('HTTP_ORIGIN', 'No Origin')
        method = request.method
        
        logger.info(f"CORS Debug - Method: {method}, Origin: {origin}")
        logger.info(f"Request headers: {dict(request.META)}")
        
        response = self.get_response(request)
        
        # Log CORS-related response headers
        cors_headers = {k: v for k, v in response.items() if 'access-control' in k.lower() or 'cors' in k.lower()}
        logger.info(f"Response CORS headers: {cors_headers}")
        
        return response
