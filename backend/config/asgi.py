"""
ASGI config for config project with Django Channels support.

This exposes the ASGI callable named ``application`` using ProtocolTypeRouter
to route HTTP to Django and websocket connections to channels consumers.
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django application for HTTP
django_asgi_app = get_asgi_application()

try:
	# Lazy import to avoid import errors if routing not present yet
	from fuel.routing import websocket_urlpatterns
except Exception:
	websocket_urlpatterns = []

application = ProtocolTypeRouter({
	'http': django_asgi_app,
	'websocket': AuthMiddlewareStack(
		URLRouter(websocket_urlpatterns)
	),
})
