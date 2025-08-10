from django.urls import re_path

from .consumers import UserNotifications


websocket_urlpatterns = [
    # Example: /ws/notifications/<role>/<id>/
    re_path(r"^ws/notifications/(?P<role>[^/]+)/(?P<user_id>[^/]+)/$", UserNotifications.as_asgi()),
]
