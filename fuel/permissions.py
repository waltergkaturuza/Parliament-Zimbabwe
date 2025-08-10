from rest_framework import permissions

class IsSuperUser(permissions.BasePermission):
    """Permission for super user (developer) access"""
    def has_permission(self, request, view):
        return request.user.role == 'SUPERUSER'

class IsAdmin(permissions.BasePermission):
    """Permission for system administrators"""
    def has_permission(self, request, view):
        return request.user.role in ['SUPERUSER', 'ADMIN']

class IsMainCenterOfficer(permissions.BasePermission):
    """Permission for main center officers"""
    def has_permission(self, request, view):
        return request.user.role == 'MAIN_CENTER'

class IsSubCenterOfficer(permissions.BasePermission):
    """Permission for sub center officers"""
    def has_permission(self, request, view):
        return request.user.role == 'SUB_CENTER'

class IsMainCenterApprover(permissions.BasePermission):
    """Permission for main center approvers"""
    def has_permission(self, request, view):
        return request.user.role == 'MAIN_CENTER_APPROVER'

class IsSubCenterApprover(permissions.BasePermission):
    """Permission for sub center approvers"""
    def has_permission(self, request, view):
        return request.user.role == 'SUB_CENTER_APPROVER'

class IsApprover(permissions.BasePermission):
    """Permission for any approver (main center or sub center)"""
    def has_permission(self, request, view):
        return request.user.role in ['MAIN_CENTER_APPROVER', 'SUB_CENTER_APPROVER']

class IsBeneficiary(permissions.BasePermission):
    """Permission for beneficiaries"""
    def has_permission(self, request, view):
        return request.user.role == 'BENEFICIARY'

class IsAuditor(permissions.BasePermission):
    """Permission for auditors"""
    def has_permission(self, request, view):
        return request.user.role == 'AUDITOR'

# Alias classes to match views_main.py imports
SuperUserPermission = IsSuperUser
AdminPermission = IsAdmin
MainCenterPermission = IsMainCenterOfficer
SubCenterPermission = IsSubCenterOfficer
ApproverPermission = IsApprover
MainCenterApproverPermission = IsMainCenterApprover
SubCenterApproverPermission = IsSubCenterApprover
AuditorPermission = IsAuditor
BeneficiaryPermission = IsBeneficiary

# Workflow permissions (combine multiple permission classes)
class MainCenterApprovalPermission(permissions.BasePermission):
    """Permission for main center approval workflows"""
    def has_permission(self, request, view):
        return request.user.role in ['SUPERUSER', 'ADMIN', 'MAIN_CENTER_APPROVER']

class SubCenterApprovalPermission(permissions.BasePermission):
    """Permission for sub center approval workflows"""
    def has_permission(self, request, view):
        return request.user.role in ['SUPERUSER', 'ADMIN', 'SUB_CENTER_APPROVER']

class CrossCenterApprovalPermission(permissions.BasePermission):
    """Permission for cross center approval workflows"""
    def has_permission(self, request, view):
        return request.user.role in ['SUPERUSER', 'ADMIN', 'MAIN_CENTER_APPROVER', 'SUB_CENTER_APPROVER']

class CenterBasedObjectPermission(permissions.BasePermission):
    """Permission for center-based object access"""
    def has_permission(self, request, view):
        return request.user.role in ['SUPERUSER', 'ADMIN', 'MAIN_CENTER', 'SUB_CENTER']
    
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['SUPERUSER', 'ADMIN']:
            return True
        if request.user.role in ['MAIN_CENTER', 'MAIN_CENTER_APPROVER']:
            return True
        if request.user.role in ['SUB_CENTER', 'SUB_CENTER_APPROVER'] and hasattr(obj, 'sub_center'):
            return obj.sub_center == request.user.sub_center
        return False

# Combined permission classes to handle the OR logic used in views
class MainCenterOrSubCenterPermission(permissions.BasePermission):
    """Permission for either main center or sub center access"""
    def has_permission(self, request, view):
        return request.user.role in ['SUPERUSER', 'ADMIN', 'MAIN_CENTER', 'SUB_CENTER']

class CanManageCoupon(permissions.BasePermission):
    """Permission for coupon management"""
    def has_permission(self, request, view):
        return request.user.role in ['SUPERUSER', 'ADMIN', 'MAIN_CENTER', 'SUB_CENTER']

class AllStaffPermission(permissions.BasePermission):
    """Permission for all staff members (any role except beneficiary only)"""
    def has_permission(self, request, view):
        return request.user.role in ['SUPERUSER', 'ADMIN', 'MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'MAIN_CENTER_APPROVER', 'SUB_CENTER_APPROVER']

class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission for object owners or administrators"""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['SUPERUSER', 'ADMIN']:
            return True
        return obj.user == request.user

class SubCenterAccess(permissions.BasePermission):
    """Permission for sub center access based on assignment"""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['SUPERUSER', 'ADMIN']:
            return True
        if request.user.role in ['MAIN_CENTER', 'MAIN_CENTER_APPROVER']:
            return True
        if request.user.role in ['SUB_CENTER', 'SUB_CENTER_APPROVER'] and obj.assigned_to == request.user.sub_center:
            return True
        return False