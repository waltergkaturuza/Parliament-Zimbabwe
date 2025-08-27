import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.utils.timezone import now
from django.http import JsonResponse
from django.conf import settings

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
        else:
            duration = -1

        user = getattr(request, 'user', None)
        user_id = user.id if user and user.is_authenticated else None
        username = user.username if user and user.is_authenticated else 'Anonymous'

        log_data = {
            'timestamp': now().isoformat(),
            'method': request.method,
            'path': request.get_full_path(),
            'duration': f"{duration:.2f}s",
            'status_code': response.status_code,
            'user_id': user_id,
            'username': username,
            'ip': self.get_client_ip(request),
        }

        log_message = f"[{log_data['method']}] {log_data['path']} - {log_data['status_code']} by {log_data['username']} in {log_data['duration']}"
        logger.info(log_message)

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')

class EnforceJSONMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.method in ['POST', 'PUT', 'PATCH']:
            content_type = request.META.get('CONTENT_TYPE', '')
            if 'application/json' not in content_type:
                return JsonResponse({'error': 'Content-Type must be application/json'}, status=415)
