# fuel/urls_profile.py
from django.urls import path
from .views_profile import (
    UserProfileView, UserProfileUpdateView, UserAvatarUploadView,
    update_notification_preferences, get_notification_preferences,
    profile_stats, recent_activity, change_password
)

app_name = 'profile'

urlpatterns = [
    # Current user profile endpoints
    path('profile/', UserProfileView.as_view(), name='current-user-profile'),
    path('profile/update/', UserProfileUpdateView.as_view(), name='update-current-user-profile'),
    path('profile/avatar/', UserAvatarUploadView.as_view(), name='upload-current-user-avatar'),
    
    # Specific user profile endpoints (admin access)
    path('profile/<int:user_id>/', UserProfileView.as_view(), name='user-profile'),
    path('profile/<int:user_id>/update/', UserProfileUpdateView.as_view(), name='update-user-profile'),
    path('profile/<int:user_id>/avatar/', UserAvatarUploadView.as_view(), name='upload-user-avatar'),
    
    # Notification preferences
    path('profile/notifications/', get_notification_preferences, name='get-notification-preferences'),
    path('profile/notifications/update/', update_notification_preferences, name='update-notification-preferences'),
    
    # Profile stats and activity
    path('profile/stats/', profile_stats, name='profile-stats'),
    path('profile/activity/', recent_activity, name='recent-activity'),
    
    # Password management
    path('profile/change-password/', change_password, name='change-password'),
]
