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