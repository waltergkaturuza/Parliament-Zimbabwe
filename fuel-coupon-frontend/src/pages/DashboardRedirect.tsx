import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const DashboardRedirect = () => {
  const { user, isAuthLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false); // Ref to prevent multiple redirects

  // Initial mount log
  console.log("DashboardRedirect: Initializing, isAuthLoading:", isAuthLoading, "isAuthenticated:", isAuthenticated, "user:", user);

  useEffect(() => {
    console.log("DashboardRedirect: useEffect running. isAuthLoading:", isAuthLoading, "isAuthenticated:", isAuthenticated, "user:", user);

    // Wait for authentication to finish loading
    if (isAuthLoading) {
      console.log("DashboardRedirect: Auth is loading, returning early.");
      return;
    }

    // If loading is finished and user is NOT authenticated (or user object is null)
    // Note: !isAuthenticated should generally imply !user if AuthContext is correct
    if (!isAuthenticated || !user) {
      console.log("DashboardRedirect: User is not authenticated or user object is null. Redirecting to login.");
       // Use the ref to ensure we only attempt navigation once
      if (!hasRedirected.current) {
        hasRedirected.current = true; // Mark as redirected
        console.log("DashboardRedirect: Navigating to /login...");
        navigate('/login', { replace: true });
      } else {
        console.log("DashboardRedirect: Already marked for login redirect, skipping navigation attempt.");
      }
      return; // Exit the effect after handling unauthenticated state
    }

    // At this point, isAuthLoading is false, isAuthenticated is true, and user is not null

    // If we reach here and have already redirected (shouldn't happen if unauthenticated path was taken),
    // or if a role-based redirect already occurred on a previous effect run.
    if (hasRedirected.current) {
      console.log("DashboardRedirect: Already redirected once, skipping role check.");
      return; // Exit if a redirect has already been performed
    }

    // Mark that a redirect is about to be attempted (this effect run will trigger a redirect)
    hasRedirected.current = true;    // Get the single role from user object
    const role = user.role?.toString().trim().toUpperCase();
    console.log("DashboardRedirect: Processing role:", role);
    
    // Role-based redirect routing
    const routeMap: { [role: string]: string } = {
      SUPERUSER: '/dashboard/inventory-overview', // Give SUPERUSER access to main center operations
      ADMIN: '/dashboard/inventory-overview', // Give ADMIN access to main center operations  
      MAIN_CENTER: '/dashboard/inventory-overview',
      SUB_CENTER: '/dashboard/sub-center',
      AUDITOR: '/dashboard/audit',
      MAIN_CENTER_APPROVER: '/dashboard/approvals',
      SUB_CENTER_APPROVER: '/dashboard/approvals',
      BENEFICIARY: '/dashboard/beneficiary',
      SERGEANT_OF_ARMS: '/sergeant-of-arms', // Parliamentary calendar dashboard
    };

    const targetPath = routeMap[role] || null;

    console.log("DashboardRedirect: User Role:", role, "→ Target:", targetPath);
    console.log("DashboardRedirect: Available routes:", Object.keys(routeMap));

    if (targetPath) {
      console.log(`DashboardRedirect: Valid role found, navigating to ${targetPath}...`);
      navigate(targetPath, { replace: true });
    } else {
      console.error("DashboardRedirect: No valid role found in map. User role:", role, "Available roles:", Object.keys(routeMap));
      console.log("DashboardRedirect: Redirecting to /dashboard/overview as fallback for authenticated user.");
       // Authenticated user but role not in map - redirect to overview dashboard as fallback
      navigate('/dashboard/overview', { replace: true });
    }

    // No explicit return needed here, as navigation is triggered.

  }, [user, isAuthenticated, isAuthLoading, navigate]); // Dependencies ensure effect runs when these values change
  // Render logic: Show spinner while loading, otherwise render nothing (as the effect handles navigation)
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
            size="large"
          />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not loading, the useEffect has either already redirected or will redirect.
  // Return null so this component doesn't render anything visible in the meantime.
  return null;
}; // Correct closing brace for the component

export default DashboardRedirect;
