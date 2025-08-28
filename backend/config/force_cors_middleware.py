# Temporary middleware to force CORS headers for debugging
# Remove once proper CORS behavior is confirmed

class ForceCorsMiddleware:
    """Set Access-Control-Allow-Origin and related headers on every response
    when an Origin header is present. This is a short-term workaround to ensure
    browser requests receive the expected CORS headers while we diagnose root cause.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        origin = request.headers.get('Origin') or request.META.get('HTTP_ORIGIN')
        if origin:
            # Echo the origin to support credentials
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            # Ensure the Vary header includes Origin
            vary = response.get('Vary')
            if vary:
                if 'Origin' not in [h.strip() for h in vary.split(',')]:
                    response['Vary'] = f"{vary}, Origin"
            else:
                response['Vary'] = 'Origin'
            # Allow common methods and headers used by the frontend
            response.setdefault('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
            response.setdefault('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-CSRFToken, X-Requested-With')
        return response
