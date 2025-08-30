# fuel/permissions/roles.py
"""
Role-specific permission classes using the modular base system.
This reduces code duplication and provides clear, reusable permissions.
"""
from .base import RoleBasedPermission, AdminPermissionMixin, ApproverPermissionMixin, CenterAccessMixin


class SuperUserPermission(RoleBasedPermission):
    """Permission for super users (developers)"""
    allowed_roles = ['SUPERUSER']


class AdminPermission(RoleBasedPermission):
    """Permission for system administrators"""
    allowed_roles = ['SUPERUSER', 'ADMIN']


class MainCenterPermission(RoleBasedPermission):
    """Permission for main center operations"""
    allowed_roles = ['SUPERUSER', 'ADMIN', 'MAIN_CENTER', 'MAIN_CENTER_APPROVER']


class SubCenterPermission(RoleBasedPermission):
    """Permission for sub center operations"""
    allowed_roles = ['SUPERUSER', 'ADMIN', 'SUB_CENTER', 'SUB_CENTER_APPROVER']


class ApproverPermission(RoleBasedPermission):
    """Permission for any approver role"""
    allowed_roles = ['MAIN_CENTER_APPROVER', 'SUB_CENTER_APPROVER']


class MainCenterApproverPermission(RoleBasedPermission):
    """Permission for main center approvers"""
    allowed_roles = ['MAIN_CENTER_APPROVER']


class SubCenterApproverPermission(RoleBasedPermission):
    """Permission for sub center approvers"""
    allowed_roles = ['SUB_CENTER_APPROVER']


class AuditorPermission(RoleBasedPermission):
    """Permission for auditors"""
    allowed_roles = ['SUPERUSER', 'ADMIN', 'AUDITOR']


class BeneficiaryPermission(RoleBasedPermission):
    """Permission for beneficiaries"""
    allowed_roles = ['BENEFICIARY']


class BeneficiaryManagementPermission(RoleBasedPermission):
    """Permission for managing beneficiaries - allows multiple roles"""
    allowed_roles = ['SUPERUSER', 'ADMIN', 'MAIN_CENTER', 'MAIN_CENTER_APPROVER', 'SUB_CENTER', 'SUB_CENTER_APPROVER', 'AUDITOR']


class CenterAndAuditorPermission(RoleBasedPermission):
    """Permission for center operations and auditors"""
    allowed_roles = ['SUPERUSER', 'ADMIN', 'MAIN_CENTER', 'MAIN_CENTER_APPROVER', 'SUB_CENTER', 'SUB_CENTER_APPROVER', 'AUDITOR', 'BENEFICIARY']


class CenterOperationsPermission(RoleBasedPermission):
    """Permission for center operations"""
    allowed_roles = ['SUPERUSER', 'ADMIN', 'MAIN_CENTER', 'MAIN_CENTER_APPROVER', 'SUB_CENTER', 'SUB_CENTER_APPROVER']


class CenterBasedObjectPermission(AdminPermissionMixin, CenterAccessMixin):
    """
    Object-level permission that checks center-based access.
    Reduces code duplication for center-specific object permissions.
    """
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Admin access
        if self.is_admin(user):
            return True
        
        # Check if object has sub_center attribute
        if hasattr(obj, 'sub_center'):
            return self.has_sub_center_access(user, obj.sub_center)
        
        # Check if object has assigned_to (for dispatches, etc.)
        if hasattr(obj, 'assigned_to'):
            return self.has_sub_center_access(user, obj.assigned_to)
        
        # Default to main center access for objects without center assignment
        return self.has_main_center_access(user)
