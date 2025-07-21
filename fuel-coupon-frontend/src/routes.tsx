// src/routes.tsx
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorPage from '@/pages/ErrorPage';
import NotFound from '@/pages/NotFound';
import { useAuth } from '@/contexts/AuthContext';

// Layouts
import UnifiedLayout from '@/layouts/UnifiedLayout';

// Protection components
import ProtectedRoute, { AdminOnlyRoute, MainCenterRoute, SubCenterRoute, ApproverRoute } from '@/components/ProtectedRoute';

// Public pages (non-lazy)
import Home from '@/pages/Home';
import Login from '@/pages/auth/Login';
import Register from '@/pages/Register';
import Unauthorized from '@/pages/Unauthorized';

// Protected components
import DashboardRedirect from '@/pages/DashboardRedirect';



// Lazy-loaded Page Components
const OverviewDashboard = lazy(() => import('@/pages/OverviewDashboard'));
const AnalyticsDashboard = lazy(() => import('@/pages/dashboard/AnalyticsDashboard'));
const MainCenterDashboard = lazy(() => import('@/pages/main-center/MainCenterDashboard'));

// Main Center Dedicated Pages
const BoxReceiptPage = lazy(() => import('@/pages/main-center/BoxReceiptPage'));
const BookDispatchPage = lazy(() => import('@/pages/main-center/BookDispatchPage'));
const FuelPricingPage = lazy(() => import('@/pages/main-center/FuelPricingPage'));
const InventoryOverviewPage = lazy(() => import('@/pages/main-center/InventoryOverviewPage'));
const SubCenterMonitoringPage = lazy(() => import('@/pages/main-center/SubCenterMonitoringPage'));
const AnalyticsFinancePage = lazy(() => import('@/pages/main-center/AnalyticsFinancePage'));

const CouponManagement = lazy(() => import('@/pages/fuel/CouponManagement'));
const BeneficiaryManagement = lazy(() => import('@/pages/parliament/BeneficiaryManagement'));
const ReportsAnalytics = lazy(() => import('@/pages/reports/ReportsAnalytics'));
const SubCenterDashboardPage = lazy(() => import('@/pages/subcenter/SubCenterDashboard'));
const BeneficiaryDashboardPage = lazy(() => import('@/pages/beneficiary/BeneficiaryDashboard'));
const AdminDashboard = lazy(() => import('@/pages/dashboard/AdminDashboard'));
const ApprovalDashboardPage= lazy(() => import('@/pages/dashboard/ApprovalDashboard'));
const UserApprovalDashboard = lazy(() => import('@/pages/admin/UserApprovalDashboard'));

// Main Center specific pages
const CenterOverview = lazy(() => import('@/pages/subcenter/CenterOverview'));
const HandoverManagement = lazy(() => import('@/pages/handovers/HandoverManagement'));
const FuelDistribution = lazy(() => import('@/pages/fuel/FuelDistribution'));
const LocalInventory = lazy(() => import('@/pages/inventory/LocalInventory'));

// Parliament pages
const SessionManagement = lazy(() => import('@/pages/parliament/SessionManagement'));
const ParliamentSessionsPage = lazy(() => import('@/pages/parliament/ParliamentSessionsPage'));
const ProgramsPage = lazy(() => import('@/pages/parliament/ProgramsPage'));
const AttendanceTracking = lazy(() => import('@/pages/parliament/AttendanceTracking'));
const FuelAllocations = lazy(() => import('@/pages/fuel/FuelAllocations'));

// Parliament oversight pages (MAIN_CENTER)
const ParliamentReports = lazy(() => import('@/pages/parliament/ParliamentReports'));
const SubCenterParliamentActivity = lazy(() => import('@/pages/parliament/SubCenterParliamentActivity'));
const SystemParliamentAnalytics = lazy(() => import('@/pages/parliament/SystemParliamentAnalytics'));

// Test components
const SubCenterParliamentActivityTest = lazy(() => import('@/pages/parliament/SubCenterParliamentActivityTest'));

// Audit pages
const ComplianceReports = lazy(() => import('@/pages/audit/ComplianceReports'));
const TransactionAudit = lazy(() => import('@/pages/audit/TransactionAudit'));

// Analytics and admin pages
const UsageAnalytics = lazy(() => import('@/pages/analytics/UsageAnalytics'));
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
const SubCenterSettings = lazy(() => import('@/pages/subcenter/SubCenterSettings'));
const SubCenterManagement = lazy(() => import('@/pages/subcenter/SubCenterManagement'));
const SystemSettings = lazy(() => import('@/pages/admin/SystemSettings'));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs'));

// New admin pages
const SystemSettingsPage = lazy(() => import('@/pages/admin/SystemSettingsPage'));
const UsersManagementPage = lazy(() => import('@/pages/admin/UsersManagementPage'));
const SystemAlertsPage = lazy(() => import('@/pages/admin/SystemAlertsPage'));
const ReportsAnalyticsPage = lazy(() => import('@/pages/admin/ReportsAnalyticsPage'));

// Test pages
const BookDispatchTest = lazy(() => import('@/pages/test/BookDispatchTest'));

// Auth Guard Component
interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !requiredRoles.some(role => user?.role === role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<ErrorPage />}>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes using UnifiedLayout */}
      <Route
        path="/dashboard/*"
        element={
          <AuthGuard>
            <UnifiedLayout />
          </AuthGuard>
        }
      >
        {/* Nested routes corresponding to sidebar navigation */}
        <Route index element={<DashboardRedirect />} />
        
        {/* Main Center Routes - Protected */}
        <Route path="main-center" element={
          <MainCenterRoute>
            <Suspense fallback={<LoadingSpinner />}><MainCenterDashboard /></Suspense>
          </MainCenterRoute>
        } />
        
        {/* Dedicated Main Center Operation Routes - Protected */}
        <Route path="box-receipt" element={
          <MainCenterRoute>
            <Suspense fallback={<LoadingSpinner />}><BoxReceiptPage /></Suspense>
          </MainCenterRoute>
        } />
        <Route path="book-dispatch" element={
          <MainCenterRoute>
            <Suspense fallback={<LoadingSpinner />}><BookDispatchPage /></Suspense>
          </MainCenterRoute>
        } />
        <Route path="fuel-pricing" element={
          <ProtectedRoute requireApprovalAccess={true}>
            <Suspense fallback={<LoadingSpinner />}><FuelPricingPage /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="inventory-overview" element={
          <MainCenterRoute>
            <Suspense fallback={<LoadingSpinner />}><InventoryOverviewPage /></Suspense>
          </MainCenterRoute>
        } />
        <Route path="sub-center-monitoring" element={
          <MainCenterRoute>
            <Suspense fallback={<LoadingSpinner />}><SubCenterMonitoringPage /></Suspense>
          </MainCenterRoute>
        } />
        <Route path="analytics-finance" element={
          <MainCenterRoute>
            <Suspense fallback={<LoadingSpinner />}><AnalyticsFinancePage /></Suspense>
          </MainCenterRoute>
        } />
        
        {/* Sub Center Routes */}
        <Route path="center-overview" element={<Suspense fallback={<LoadingSpinner />}><CenterOverview /></Suspense>} />
        <Route path="handovers" element={<Suspense fallback={<LoadingSpinner />}><HandoverManagement /></Suspense>} />
        <Route path="fuel-distribution" element={<Suspense fallback={<LoadingSpinner />}><FuelDistribution /></Suspense>} />
        <Route path="local-inventory" element={<Suspense fallback={<LoadingSpinner />}><LocalInventory /></Suspense>} />
        
        {/* Parliament Routes */}
        <Route path="beneficiaries" element={<Suspense fallback={<LoadingSpinner />}><BeneficiaryManagement /></Suspense>} />
        <Route path="sessions" element={<Suspense fallback={<LoadingSpinner />}><ParliamentSessionsPage /></Suspense>} />
        <Route path="programs" element={<Suspense fallback={<LoadingSpinner />}><ProgramsPage /></Suspense>} />
        <Route path="attendance" element={<Suspense fallback={<LoadingSpinner />}><AttendanceTracking /></Suspense>} />
        <Route path="fuel-allocations" element={<Suspense fallback={<LoadingSpinner />}><FuelAllocations /></Suspense>} />
        
        {/* Parliament Oversight Routes (MAIN_CENTER) */}
        <Route path="parliament-reports" element={
          <MainCenterRoute>
            <Suspense fallback={<LoadingSpinner />}><ParliamentReports /></Suspense>
          </MainCenterRoute>
        } />
        <Route path="subcenter-activities" element={
          <MainCenterRoute>
            <Suspense fallback={<LoadingSpinner />}><SubCenterParliamentActivity /></Suspense>
          </MainCenterRoute>
        } />
        <Route path="system-analytics" element={
          <MainCenterRoute>
            <Suspense fallback={<LoadingSpinner />}><SystemParliamentAnalytics /></Suspense>
          </MainCenterRoute>
        } />
        
        {/* Test Routes */}
        <Route path="subcenter-activities-test" element={
          <Suspense fallback={<LoadingSpinner />}><SubCenterParliamentActivityTest /></Suspense>
        } />
        
        {/* Analytics Routes */}
        <Route path="analytics" element={<Suspense fallback={<LoadingSpinner />}><UsageAnalytics /></Suspense>} />
        
        {/* Admin Routes */}
        <Route path="users" element={<Suspense fallback={<LoadingSpinner />}><UsersPage /></Suspense>} />
        <Route path="subcenters" element={<Suspense fallback={<LoadingSpinner />}><SubCenterSettings /></Suspense>} />
        <Route path="subcenter-management" element={<Suspense fallback={<LoadingSpinner />}><SubCenterManagement /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<LoadingSpinner />}><SystemSettings /></Suspense>} />
        <Route path="audit-logs" element={<Suspense fallback={<LoadingSpinner />}><AuditLogs /></Suspense>} />
        
        {/* Audit Routes */}
        <Route path="compliance" element={<Suspense fallback={<LoadingSpinner />}><ComplianceReports /></Suspense>} />
        <Route path="transaction-audit" element={<Suspense fallback={<LoadingSpinner />}><TransactionAudit /></Suspense>} />
        
        {/* Dashboard role-based routes */}
        <Route path="overview" element={<Suspense fallback={<LoadingSpinner />}><OverviewDashboard /></Suspense>} />
        <Route path="sub-center" element={<Suspense fallback={<LoadingSpinner />}><SubCenterDashboardPage /></Suspense>} />
        <Route path="beneficiary" element={<Suspense fallback={<LoadingSpinner />}><BeneficiaryDashboardPage /></Suspense>} />
        <Route path="audit" element={<Suspense fallback={<LoadingSpinner />}><TransactionAudit /></Suspense>} />
        
        {/* Legacy dashboard routes */}
        <Route path="main" element={<Suspense fallback={<LoadingSpinner />}><OverviewDashboard /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<LoadingSpinner />}><AnalyticsDashboard /></Suspense>} />
        <Route path="sub" element={<Suspense fallback={<LoadingSpinner />}> <SubCenterDashboardPage /></Suspense>} />
        <Route path="admin" element={<Suspense fallback={<LoadingSpinner />}> <AdminDashboard /></Suspense>} />
        <Route path="approvals" element={<Suspense fallback={<LoadingSpinner />}> <ApprovalDashboardPage /></Suspense>} />
      </Route>

      {/* Fuel Management Routes */}
      <Route
        path="/fuel/*"
        element={
          <AuthGuard>
            <UnifiedLayout />
          </AuthGuard>
        }
      >
        <Route path="management" element={<Suspense fallback={<LoadingSpinner />}><CouponManagement /></Suspense>} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <AdminOnlyRoute>
            <UnifiedLayout />
          </AdminOnlyRoute>
        }
      >
        <Route path="settings" element={<Suspense fallback={<LoadingSpinner />}><SystemSettingsPage /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<LoadingSpinner />}><UsersManagementPage /></Suspense>} />
        <Route path="alerts" element={<Suspense fallback={<LoadingSpinner />}><SystemAlertsPage /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<LoadingSpinner />}><ReportsAnalyticsPage /></Suspense>} />
        <Route path="audit-logs" element={<Suspense fallback={<LoadingSpinner />}><AuditLogs /></Suspense>} />
      </Route>

      {/* Reporting Routes */}
      <Route
        path="/reports/*"
        element={
          <AuthGuard>
            <UnifiedLayout />
          </AuthGuard>
        }
      >
        <Route path="analytics" element={<Suspense fallback={<LoadingSpinner />}><ReportsAnalytics /></Suspense>} />
      </Route>

      {/* User Management Routes */}
      <Route
        path="/approvals/*"
        element={
          <AuthGuard requiredRoles={['SUPER_ADMIN', 'MAIN_CENTER']}>
            <UnifiedLayout />
          </AuthGuard>
        }
      >
        <Route path="users" element={<Suspense fallback={<LoadingSpinner />}><UserApprovalDashboard /></Suspense>} />
      </Route>

      {/* Test routes */}
      <Route path="test/book-dispatch" element={<Suspense fallback={<LoadingSpinner />}><BookDispatchTest /></Suspense>} />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

// Named export for clarity
export { router };
// Default export
export default router;
