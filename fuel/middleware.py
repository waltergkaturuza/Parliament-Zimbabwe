"""
Custom CSRF middleware that exempts API endpoints from CSRF verification
since they use JWT authentication instead.
"""
import re
from django.middleware.csrf import CsrfViewMiddleware
from django.conf import settings


class CsrfExemptMiddleware(CsrfViewMiddleware):
    """
    CSRF middleware that exempts specific URL patterns from CSRF verification.
    This is needed for API endpoints that use JWT authentication.
    """
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        # Get CSRF exempt URLs from settings
        exempt_urls = getattr(settings, 'CSRF_EXEMPT_URLS', [])
        
        # Check if the request path matches any exempt patterns
        for pattern in exempt_urls:
            if re.match(pattern, request.path):
                # Mark the view as CSRF exempt
                setattr(callback, 'csrf_exempt', True)
                return None
                
        # Continue with normal CSRF processing for non-exempt URLs
        return super().process_view(request, callback, callback_args, callback_kwargs)
