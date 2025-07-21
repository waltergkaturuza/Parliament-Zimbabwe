# fuel/permissions/workflows.py
"""
Approval workflow permissions for different operations.
This module provides specific permissions for approval workflows.
"""
from rest_framework import permissions
from .base import ApproverPermissionMixin, AdminPermissionMixin


class MainCenterApprovalPermission(permissions.BasePermission, ApproverPermissionMixin, AdminPermissionMixin):
    """
    Permission for operations that require main center approval:
    - Dispatch creation/approval
    - Fuel pricing updates
    - Box/book restocking
    """
    
    def has_permission(self, request, view):
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
        
        # Admin access
        if self.is_admin(user):
            return True
        
        # Main center staff can create, main center approvers can approve
        if request.method in ['GET', 'POST']:
            return user.role in ['MAIN_CENTER', 'MAIN_CENTER_APPROVER']
        
        # Approval actions require main center approver
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return self.is_main_center_approver(user)
        
        return False


class SubCenterApprovalPermission(permissions.BasePermission, ApproverPermissionMixin, AdminPermissionMixin):
    """
    Permission for operations that require sub center approval:
    - Fuel allocations to beneficiaries
    - Program management
    - Coupon distribution
    """
    
    def has_permission(self, request, view):
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
        
        # Admin access
        if self.is_admin(user):
            return True
        
        # Sub center staff can create, sub center approvers can approve
        if request.method in ['GET', 'POST']:
            return user.role in ['SUB_CENTER', 'SUB_CENTER_APPROVER']
        
        # Approval actions require sub center approver
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return self.is_sub_center_approver(user)
        
        return False


class CrossCenterApprovalPermission(permissions.BasePermission, ApproverPermissionMixin, AdminPermissionMixin):
    """
    Permission for operations that may require approval from either center:
    - System-wide reports
    - Cross-center transfers
    """
    
    def has_permission(self, request, view):
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
        
        # Admin access
        if self.is_admin(user):
            return True
        
        # Any approver can access
        return self.is_approver(user)
