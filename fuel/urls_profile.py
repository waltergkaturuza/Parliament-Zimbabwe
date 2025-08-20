# fuel/urls_profile.py
"""
URL patterns for user profile management.
"""
from django.urls import path
from django.http import JsonResponse

def lazy_view(view_name):
    def _view(request, *args, **kwargs):
        try:
            from . import views_profile
            view = getattr(views_profile, view_name)
            return view(request, *args, **kwargs)
        except Exception as e:
            return JsonResponse({
                'detail': f'Endpoint temporarily unavailable: {view_name}',
                'error': str(e)
            }, status=503)
    return _view

urlpatterns = [
    # Profile management
    path('profile/summary/', lazy_view('profile_summary'), name='profile-summary'),
    path('profile/<int:user_id>/', lazy_view('user_profile_view'), name='user-profile'),
    path('profile/me/', lazy_view('user_profile_view'), name='my-profile'),
    path('profile/change-password/', lazy_view('change_password'), name='change-password'),
]
