# fuel/urls_profile.py
"""
URL patterns for user profile management.
"""
from django.urls import path
from .views_profile import (
    user_profile_view,
    profile_summary, 
    change_password
)

urlpatterns = [
    # Profile management
    path('profile/summary/', profile_summary, name='profile-summary'),
    path('profile/<int:user_id>/', user_profile_view, name='user-profile'),
    path('profile/me/', user_profile_view, name='my-profile'),
    path('profile/change-password/', change_password, name='change-password'),
]
