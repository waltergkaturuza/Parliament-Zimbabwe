# fuel/permissions/__init__.py
"""
Modular permission system for the fuel coupon management system.
This package provides reusable, modular permissions to reduce code duplication.
"""

# Base components
from .base import (
    RoleBasedPermission,
    AdminPermissionMixin,
    ApproverPermissionMixin,
    CenterAccessMixin,
    IsOwnerOrAdmin,
)

# Role-specific permissions
from .roles import (
    SuperUserPermission,
    AdminPermission,
    MainCenterPermission,
    SubCenterPermission,
    ApproverPermission,
    MainCenterApproverPermission,
    SubCenterApproverPermission,
    AuditorPermission,
    BeneficiaryPermission,
    CenterBasedObjectPermission,
    
    # Combined permissions for ViewSets
    MainCenterOrSubCenterPermission,
    CanManageCoupon,
    AllStaffPermission,
)

# Workflow permissions
from .workflows import (
    MainCenterApprovalPermission,
    SubCenterApprovalPermission,
    CrossCenterApprovalPermission,
)

# Legacy compatibility (keeping old imports working)
IsMainCenterOfficer = MainCenterPermission
IsSubCenterOfficer = SubCenterPermission
IsApprover = ApproverPermission
IsMainCenterApprover = MainCenterApproverPermission
IsSubCenterApprover = SubCenterApproverPermission
IsAuditor = AuditorPermission
IsBeneficiary = BeneficiaryPermission
IsSuperUser = SuperUserPermission
IsAdmin = AdminPermission
SubCenterAccess = CenterBasedObjectPermission

__all__ = [
    # Base components
    'RoleBasedPermission',
    'AdminPermissionMixin',
    'ApproverPermissionMixin',
    'CenterAccessMixin',
    'IsOwnerOrAdmin',
    
    # Role permissions
    'SuperUserPermission',
    'AdminPermission',
    'MainCenterPermission',
    'SubCenterPermission',
    'ApproverPermission',
    'MainCenterApproverPermission',
    'SubCenterApproverPermission',
    'AuditorPermission',
    'BeneficiaryPermission',
    'CenterBasedObjectPermission',
    
    # Combined permissions
    'MainCenterOrSubCenterPermission',
    'CanManageCoupon',
    'AllStaffPermission',
    
    # Workflow permissions
    'MainCenterApprovalPermission',
    'SubCenterApprovalPermission',
    'CrossCenterApprovalPermission',
    
    # Legacy compatibility
    'IsMainCenterOfficer',
    'IsSubCenterOfficer',
    'IsApprover',
    'IsMainCenterApprover',
    'IsSubCenterApprover',
    'IsAuditor',
    'IsBeneficiary',
    'IsSuperUser',
    'IsAdmin',
    'SubCenterAccess',
]
