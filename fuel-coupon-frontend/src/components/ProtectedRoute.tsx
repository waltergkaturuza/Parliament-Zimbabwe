import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRolePermissions, Role } from '@/hooks/useRolePermissions';
import { Spin, Result } from 'antd';
import { LoadingOutlined, LockOutlined } from '@ant-design/icons';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Keep for backward compatibility
  requiredRoles?: Role[];
  requireMainCenterAccess?: boolean;
  requireSubCenterAccess?: boolean;
  requireApprovalAccess?: boolean;
  children?: React.ReactNode;
}

/**
 * Enhanced ProtectedRoute with modular permission system
 * Reduces code duplication by providing reusable route guards
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles, // Legacy support
  requiredRoles = [],
  requireMainCenterAccess = false,
  requireSubCenterAccess = false,
  requireApprovalAccess = false,
  children 
}) => {
  const { isAuthenticated, user, isAuthLoading } = useAuth();
  const location = useLocation();
  const permissions = useRolePermissions();

  // Show loading while auth is being determined
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Legacy role checking (backward compatibility)
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // New modular permission checking
  const hasRequiredRole = requiredRoles.length === 0 || 
    requiredRoles.includes(user?.role as Role);

  const hasMainCenterAccess = !requireMainCenterAccess || permissions.hasMainCenterAccess;
  const hasSubCenterAccess = !requireSubCenterAccess || permissions.hasSubCenterAccess;
  const hasApprovalAccess = !requireApprovalAccess || permissions.hasApprovalAccess;

  const hasAccess = hasRequiredRole && hasMainCenterAccess && 
                   hasSubCenterAccess && hasApprovalAccess;

  if (!hasAccess) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        icon={<LockOutlined />}
        extra={
          <div className="text-sm text-gray-500 mt-4">
            <p>Required access level not met</p>
            <p>Your role: {user?.role || 'Unknown'}</p>
          </div>
        }
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

// Convenience wrapper components for common permission patterns
export const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['SUPERUSER', 'ADMIN']}>
    {children}
  </ProtectedRoute>
);

export const MainCenterRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireMainCenterAccess={true}>
    {children}
  </ProtectedRoute>
);

export const SubCenterRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireSubCenterAccess={true}>
    {children}
  </ProtectedRoute>
);

export const ApproverRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireApprovalAccess={true}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
