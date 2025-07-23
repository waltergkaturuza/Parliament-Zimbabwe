from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Authentication views
    RegisterView, LoginView,
    
    # Admin views
    admin_dashboard, fuel_statistics, analytics_view,
    
    # Existing ViewSets
    UserViewSet, SubCenterViewSet, BoxViewSet, BookViewSet, CouponViewSet,
    
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
    
    # Business Central integration
    test_business_central_connection,
    
    # Legacy views (keeping for compatibility)
    analytics_view,
)

router = DefaultRouter()

# User management
router.register(r'users', UserViewSet, basename='user')
router.register(r'subcenters', SubCenterViewSet, basename='subcenter')
router.register(r'sub-centers', SubCenterViewSet, basename='subcenter-alias')  # Alias for frontend compatibility

# Coupon management
router.register(r'boxes', BoxViewSet, basename='box')
router.register(r'books', BookViewSet, basename='book')
router.register(r'coupons', CouponViewSet, basename='coupon')

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

# Programs and attendance (legacy)
# router.register(r'programs', ProgramViewSet, basename='program')  # TODO: Implement Program model
# router.register(r'attendances', AttendanceViewSet, basename='attendance')  # TODO: Commented out - no Attendance model

urlpatterns = [
    # Authentication
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    
    # Admin endpoints
    path('admin/dashboard/', admin_dashboard, name='admin-dashboard'),
    path('fuel-stats/', fuel_statistics, name='fuel-statistics'),
    
    # Analytics
    path('analytics/', analytics_view, name='analytics-view'),
    
    # Business Central integration
    path('business-central/test/', test_business_central_connection, name='test-business-central'),
    
    # Include router URLs 
    path('', include(router.urls)),
    
    # TODO: Add missing views for analytics, dashboard, audit functions, etc.
]
