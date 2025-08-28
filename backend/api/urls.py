"""
URL configuration for API endpoints
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_info, name='api_info'),
]
