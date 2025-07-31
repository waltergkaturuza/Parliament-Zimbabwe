from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Authentication views
    RegisterView, LoginView,
    
    # Admin views
    admin_dashboard, fuel_statistics, analytics_view,
    
    # Existing ViewSets
    UserViewSet, SubCenterViewSet, SubCenterOfficerViewSet, BoxViewSet, BookViewSet, CouponViewSet,
    FuelTransactionViewSet,
    
    # New Parliament-specific ViewSets
    BeneficiaryCategoryViewSet, ConstituencyViewSet, VehicleCategoryViewSet,
    ParliamentSessionViewSet, SessionAttendanceViewSet, BeneficiaryProfileViewSet,
    FuelEntitlementViewSet,
    
    # Subcenter management ViewSets
    PoolVehicleViewSet, DriverViewSet, VehicleAssignmentViewSet,
    
    # Dispatch and allocation ViewSets
    BookDispatchViewSet, CouponAllocationViewSet,
    
    # System management ViewSets
    SystemAlertViewSet, AuditLogViewSet,
    
    # Missing ViewSets - Added
    FuelDataViewSet, CouponDistributionViewSet,
    
    # Business Central integration
    test_business_central_connection,
    
    # CORS test views - now in main views.py
    cors_test, health_check,
)

# Import debug views
from .views_debug import test_azure_database, health_check as debug_health_check

# Import setup views
from .views_setup import create_superuser_api, database_status_api

# Home page API views
from .views_home import (
    home_stats, recent_activity, system_health, quick_insights
)

# Business Central production integration views
from .views_bc_production import (
    bc_webhook, bc_dashboard_data, BCDashboardView, 
    bc_transaction_approve, bc_health_check
)

router = DefaultRouter()

# User management
router.register(r'users', UserViewSet, basename='user')
router.register(r'subcenters', SubCenterViewSet, basename='subcenter')
router.register(r'sub-centers', SubCenterViewSet, basename='subcenter-alias')  # Alias for frontend compatibility
router.register(r'subcenter-officers', SubCenterOfficerViewSet, basename='subcenter-officer')

# Coupon management
router.register(r'boxes', BoxViewSet, basename='box')
router.register(r'books', BookViewSet, basename='book')
router.register(r'coupons', CouponViewSet, basename='coupon')
router.register(r'fuel-transactions', FuelTransactionViewSet, basename='fuel-transaction')

# Dispatch and allocation management
router.register(r'dispatches', BookDispatchViewSet, basename='dispatch')
router.register(r'allocations', CouponAllocationViewSet, basename='allocation')

# Parliament-specific entities
router.register(r'beneficiary-categories', BeneficiaryCategoryViewSet, basename='beneficiary-category')
router.register(r'constituencies', ConstituencyViewSet, basename='constituency')
router.register(r'vehicle-categories', VehicleCategoryViewSet, basename='vehicle-category')
router.register(r'parliament-sessions', ParliamentSessionViewSet, basename='parliament-session')
router.register(r'session-attendances', SessionAttendanceViewSet, basename='session-attendance')
router.register(r'beneficiary-profiles', BeneficiaryProfileViewSet, basename='beneficiary-profile')
router.register(r'fuel-entitlements', FuelEntitlementViewSet, basename='fuel-entitlement')

# Subcenter management
router.register(r'pool-vehicles', PoolVehicleViewSet, basename='pool-vehicle')
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'vehicle-assignments', VehicleAssignmentViewSet, basename='vehicle-assignment')

# System management
router.register(r'system-alerts', SystemAlertViewSet, basename='system-alert')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

# Data management - Missing ViewSets Added
router.register(r'fuel-data', FuelDataViewSet, basename='fuel-data')
router.register(r'coupon-distributions', CouponDistributionViewSet, basename='coupon-distribution')

# Programs and attendance (legacy)
# router.register(r'programs', ProgramViewSet, basename='program')  # TODO: Implement Program model
# router.register(r'attendances', AttendanceViewSet, basename='attendance')  # TODO: Commented out - no Attendance model

urlpatterns = [
    # Authentication
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    
    # Home page APIs
    path('api/home/stats/', home_stats, name='home-stats'),
    path('api/home/activity/', recent_activity, name='home-activity'),
    path('api/home/health/', system_health, name='home-health'),
    path('api/home/insights/', quick_insights, name='home-insights'),
    
    # Business Central Production Integration
    path('api/bc/webhook/', bc_webhook, name='bc-webhook'),
    path('api/bc/dashboard-data/', bc_dashboard_data, name='bc-dashboard-data'),
    path('api/bc/transaction/<int:transaction_id>/approve/', bc_transaction_approve, name='bc-transaction-approve'),
    path('api/bc/health/', bc_health_check, name='bc-health-check'),
    path('bc/dashboard/', BCDashboardView.as_view(), name='bc-dashboard'),
    
    # Admin endpoints
    path('admin/dashboard/', admin_dashboard, name='admin-dashboard'),
    path('fuel-stats/', fuel_statistics, name='fuel-statistics'),
    
    # Analytics
    path('analytics/', analytics_view, name='analytics-view'),
    
    # Business Central integration
    path('business-central/test/', test_business_central_connection, name='test-business-central'),
    
    # CORS and health test endpoints
    path('api/cors-test/', cors_test, name='cors-test'),
    path('api/health/', health_check, name='health-check'),
    
    # Debug endpoints for Azure testing
    path('api/debug/azure-db/', test_azure_database, name='test-azure-database'),
    path('api/debug/health/', debug_health_check, name='debug-health-check'),
    
    # Setup endpoints for initial deployment
    path('api/setup/database-status/', database_status_api, name='database-status'),
    path('api/setup/create-superuser/', create_superuser_api, name='create-superuser'),
    
    # Debug endpoints for Azure deployment testing
    path('api/debug/test-db/', test_azure_database, name='test-azure-database'),
    path('api/debug/health/', debug_health_check, name='debug-health-check'),
    
    # Include router URLs 
    path('', include(router.urls)),
    
    # TODO: Add missing views for analytics, dashboard, audit functions, etc.
]
