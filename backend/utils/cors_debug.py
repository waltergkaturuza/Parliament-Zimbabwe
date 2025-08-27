# Custom CORS debugging middleware
import logging

logger = logging.getLogger(__name__)

class CORSDebugMiddleware:
    """
    Middleware to help debug CORS issues
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log CORS-related headers
        origin = request.META.get('HTTP_ORIGIN', 'No Origin')
        method = request.method
        
        logger.info(f"CORS Debug - Method: {method}, Origin: {origin}")
        logger.info(f"Request headers: {dict(request.headers)}")
        
        response = self.get_response(request)
        
        # Log response CORS headers
        cors_headers = {
            key: value for key, value in response.items() 
            if key.lower().startswith('access-control')
        }
        logger.info(f"Response CORS headers: {cors_headers}")
        
        return response
