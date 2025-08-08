# fuel/views_profile.py
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .serializers import (
    UserProfileSerializer, UserProfileUpdateSerializer, UserAvatarSerializer
)
from .permissions import IsOwnerOrAdmin

User = get_user_model()


class UserProfileView(generics.RetrieveAPIView):
    """
    Retrieve user profile information
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        user_id = self.kwargs.get('user_id')
        if user_id:
            # Admin can view any user's profile
            if self.request.user.role in ['SUPERUSER', 'ADMIN']:
                return get_object_or_404(User, id=user_id)
            # Users can only view their own profile unless they're admin
            elif str(self.request.user.id) == str(user_id):
                return self.request.user
            else:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only view your own profile.")
        return self.request.user


class UserProfileUpdateView(generics.UpdateAPIView):
    """
    Update user profile information
    """
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_object(self):
        user_id = self.kwargs.get('user_id')
        if user_id:
            return get_object_or_404(User, id=user_id)
        return self.request.user

    def perform_update(self, serializer):
        serializer.save()


class UserAvatarUploadView(generics.UpdateAPIView):
    """
    Upload or update user profile picture
    """
    serializer_class = UserAvatarSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self):
        user_id = self.kwargs.get('user_id')
        if user_id:
            return get_object_or_404(User, id=user_id)
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_notification_preferences(request):
    """
    Update user's notification preferences
    """
    try:
        user = request.user
        preferences = request.data.get('preferences', {})
        
        # Validate preferences structure
        valid_keys = [
            'email_notifications', 'sms_notifications', 'push_notifications',
            'coupon_alerts', 'system_alerts', 'fuel_price_updates',
            'account_updates', 'security_alerts'
        ]
        
        filtered_preferences = {
            key: value for key, value in preferences.items() 
            if key in valid_keys and isinstance(value, bool)
        }
        
        user.notification_preferences.update(filtered_preferences)
        user.save(update_fields=['notification_preferences'])
        
        return Response({
            'message': 'Notification preferences updated successfully',
            'preferences': user.notification_preferences
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_notification_preferences(request):
    """
    Get user's notification preferences
    """
    user = request.user
    default_preferences = {
        'email_notifications': True,
        'sms_notifications': True,
        'push_notifications': True,
        'coupon_alerts': True,
        'system_alerts': True,
        'fuel_price_updates': True,
        'account_updates': True,
        'security_alerts': True
    }
    
    # Merge default preferences with user's preferences
    preferences = {**default_preferences, **user.notification_preferences}
    
    return Response({'preferences': preferences})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_stats(request):
    """
    Get user profile statistics and activity summary
    """
    try:
        user = request.user
        
        # Basic stats
        stats = {
            'profile_completion': user.get_profile_completion_percentage(),
            'account_age_days': (timezone.now() - user.date_joined).days,
            'last_login': user.last_login,
            'last_activity': user.last_activity,
            'is_approved': user.is_approved,
            'role': user.get_role_display(),
        }
        
        # Role-specific stats
        if user.role in ['MAIN_CENTER', 'SUB_CENTER']:
            from .models import CouponDistribution, FuelTransaction
            
            stats.update({
                'total_distributions': CouponDistribution.objects.filter(
                    distributed_by=user
                ).count(),
                'total_transactions': FuelTransaction.objects.filter(
                    officer=user
                ).count(),
            })
        
        elif user.role == 'BENEFICIARY':
            from .models import Coupon
            
            stats.update({
                'total_coupons_received': Coupon.objects.filter(
                    current_beneficiary=user
                ).count(),
                'coupons_used': Coupon.objects.filter(
                    current_beneficiary=user,
                    status='USED'
                ).count(),
            })
        
        return Response({'stats': stats})
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recent_activity(request):
    """
    Get user's recent activity
    """
    try:
        user = request.user
        activities = []
        
        # Get recent audit logs for this user
        from .models import AuditLog
        recent_logs = AuditLog.objects.filter(
            user=user
        ).order_by('-timestamp')[:10]
        
        for log in recent_logs:
            activities.append({
                'timestamp': log.timestamp,
                'action': log.action,
                'model': log.model_name,
                'description': log.description,
                'ip_address': log.ip_address,
            })
        
        return Response({'activities': activities})
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """
    Change user password
    """
    try:
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validate input
        if not all([current_password, new_password, confirm_password]):
            return Response(
                {'error': 'All password fields are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {'error': 'New passwords do not match'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check current password
        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password strength
        if len(new_password) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters long'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Log the password change
        from .models import AuditLog
        AuditLog.objects.create(
            user=user,
            action='PASSWORD_CHANGED',
            model_name='User',
            object_id=user.id,
            description='User changed their password',
            ip_address=request.META.get('REMOTE_ADDR', ''),
        )
        
        return Response({'message': 'Password changed successfully'})
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
