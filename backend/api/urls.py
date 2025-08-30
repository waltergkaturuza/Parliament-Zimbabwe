"""
URL configuration for API endpoints
"""
from django.urls import path
from . import views

urlpatterns = [
    # Keep these endpoints minimal; fuel.urls serves the main API under /api and /api/v1
    path('', views.api_info, name='api_info'),
]
