# fuel/views_profile.py
"""
User profile management views for the fuel coupon system.
"""
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import User
from .serializers import UserSerializer
from .permissions import IsOwnerOrAdmin

User = get_user_model()


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsOwnerOrAdmin])
def user_profile_view(request, user_id=None):
    """
    Get or update user profile information.
    Users can only access their own profile unless they're admin.
    """
    if user_id:
        user = get_object_or_404(User, id=user_id)
        # Check object-level permission
        permission = IsOwnerOrAdmin()
        if not permission.has_object_permission(request, None, user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    else:
        user = request.user
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = UserSerializer(user, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_summary(request):
    """
    Get a summary of the current user's profile and permissions.
    """
    user = request.user
    data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'is_active': user.is_active,
        'is_approved': user.is_approved,
        'sub_center': user.sub_center.name if user.sub_center else None,
        'date_joined': user.date_joined,
        'last_login': user.last_login,
    }
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """
    Change user password.
    """
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {'error': 'Both old_password and new_password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.check_password(old_password):
        return Response(
            {'error': 'Old password is incorrect'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'})
