# fuel/permissions/base.py
"""
Base permission classes and mixins for the fuel coupon system.
This module provides reusable permission components to reduce code duplication.
"""
from rest_framework import permissions
from typing import List, Union


class RoleBasedPermission(permissions.BasePermission):
    """
    Base permission class that checks user roles.
    Reduces code duplication by providing a reusable role checking mechanism.
    """
    allowed_roles: List[str] = []
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in self.allowed_roles


class AdminPermissionMixin:
    """Mixin for admin-level permissions"""
    admin_roles = ['SUPERUSER', 'ADMIN']
    
    def is_admin(self, user) -> bool:
        return user.role in self.admin_roles


class ApproverPermissionMixin:
    """Mixin for approver-level permissions"""
    main_center_roles = ['MAIN_CENTER', 'MAIN_CENTER_APPROVER']
    sub_center_roles = ['SUB_CENTER', 'SUB_CENTER_APPROVER']
    all_approver_roles = ['MAIN_CENTER_APPROVER', 'SUB_CENTER_APPROVER']
    
    def is_approver(self, user) -> bool:
        return user.role in self.all_approver_roles
    
    def is_main_center_approver(self, user) -> bool:
        return user.role == 'MAIN_CENTER_APPROVER'
    
    def is_sub_center_approver(self, user) -> bool:
        return user.role == 'SUB_CENTER_APPROVER'


class CenterAccessMixin:
    """Mixin for center-based access control"""
    
    def has_main_center_access(self, user) -> bool:
        return user.role in ['SUPERUSER', 'ADMIN', 'MAIN_CENTER', 'MAIN_CENTER_APPROVER']
    
    def has_sub_center_access(self, user, sub_center=None) -> bool:
        if user.role in ['SUPERUSER', 'ADMIN']:
            return True
        if user.role in ['MAIN_CENTER', 'MAIN_CENTER_APPROVER']:
            return True
        if user.role in ['SUB_CENTER', 'SUB_CENTER_APPROVER']:
            return sub_center is None or user.sub_center == sub_center
        return False
