// src/hooks/useRolePermissions.ts
/**
 * Custom hook for role-based permissions
 * Provides modular permission checking to reduce code duplication
 */
import { useAuth } from '@/contexts/AuthContext';

export type Role = 'SUPERUSER' | 'ADMIN' | 'MAIN_CENTER' | 'SUB_CENTER' | 
                   'BENEFICIARY' | 'AUDITOR' | 'MAIN_CENTER_APPROVER' | 'SUB_CENTER_APPROVER';

export interface RolePermissions {
  // Admin permissions
  isSuperUser: boolean;
  isAdmin: boolean;
  isAnyAdmin: boolean;
  
  // Center permissions
  isMainCenter: boolean;
  isSubCenter: boolean;
  
  // Approver permissions
  isMainCenterApprover: boolean;
  isSubCenterApprover: boolean;
  isAnyApprover: boolean;
  
  // Other roles
  isAuditor: boolean;
  isBeneficiary: boolean;
  
  // Combined permissions
  hasMainCenterAccess: boolean;
  hasSubCenterAccess: boolean;
  hasApprovalAccess: boolean;
}

export const useRolePermissions = (): RolePermissions => {
  const { user } = useAuth();
  const role = user?.role as Role;

  const isSuperUser = role === 'SUPERUSER';
  const isAdmin = role === 'ADMIN';
  const isAnyAdmin = isSuperUser || isAdmin;
  
  const isMainCenter = role === 'MAIN_CENTER';
  const isSubCenter = role === 'SUB_CENTER';
  
  const isMainCenterApprover = role === 'MAIN_CENTER_APPROVER';
  const isSubCenterApprover = role === 'SUB_CENTER_APPROVER';
  const isAnyApprover = isMainCenterApprover || isSubCenterApprover;
  
  const isAuditor = role === 'AUDITOR';
  const isBeneficiary = role === 'BENEFICIARY';
  
  // Combined permissions
  const hasMainCenterAccess = isAnyAdmin || isMainCenter || isMainCenterApprover;
  const hasSubCenterAccess = isAnyAdmin || isSubCenter || isSubCenterApprover || hasMainCenterAccess;
  const hasApprovalAccess = isAnyAdmin || isAnyApprover;

  return {
    isSuperUser,
    isAdmin,
    isAnyAdmin,
    isMainCenter,
    isSubCenter,
    isMainCenterApprover,
    isSubCenterApprover,
    isAnyApprover,
    isAuditor,
    isBeneficiary,
    hasMainCenterAccess,
    hasSubCenterAccess,
    hasApprovalAccess,
  };
};
