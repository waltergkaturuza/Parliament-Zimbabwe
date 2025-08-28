"""Constrained Force CORS middleware for short-term debugging only.

This middleware echoes the Origin header back in the response, but only when:
- The request path starts with /api/
- The Origin matches an onrender.com subdomain (safety scoping)

Replace with proper django-cors-headers configuration and remove this file
once CORS is confirmed working in production. Keep this file minimal and
conservative to reduce risk.
"""

import re
from typing import Callable

ONRENDER_REGEX = re.compile(r"^https://.*\\.onrender\\.com$")


class ForceCorsMiddleware:
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        origin = None
        # Prefer modern header accessor when available
        try:
            origin = request.headers.get('Origin')
        except Exception:
            origin = request.META.get('HTTP_ORIGIN')

        path = request.path or ''

        if origin and path.startswith('/api/') and ONRENDER_REGEX.match(origin):
            # Echo the origin to support credentials
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'

            # Ensure Vary header includes Origin
            vary = response.get('Vary')
            if vary:
                parts = [h.strip() for h in vary.split(',')]
                if 'Origin' not in parts:
                    parts.append('Origin')
                    response['Vary'] = ', '.join(parts)
            else:
                response['Vary'] = 'Origin'

            # Ensure common methods and headers are present for preflight responses
            if not response.get('Access-Control-Allow-Methods'):
                response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, PATCH, DELETE'
            if not response.get('Access-Control-Allow-Headers'):
                response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-CSRFToken, X-Requested-With'

        return response
