from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# Use lazy imports to avoid circular import issues
def get_view_function(view_name):
    """Lazy import function to avoid circular imports"""
    from . import views_main
    return getattr(views_main, view_name)

# Import ViewSets and views that don't cause circular imports
try:
    from .views_main import (
        # Authentication views
        RegisterView, LoginView, user_profile_view, auth_roles,
        
        # Admin views
        admin_dashboard, fuel_statistics, analytics_view, notification_stats,
        
        # NEW: Missing view implementations from views_main
        main_dashboard, analytics_consumption_trend,
        change_password, mark_all_notifications_read, subcenter_statistics,
        dynamic_allocation, subcenters_stats,
        
        # Existing ViewSets
        UserViewSet, SubCenterViewSet, BoxViewSet, BookViewSet, CouponViewSet,
        
        # New Parliament-specific ViewSets
        BeneficiaryCategoryViewSet, ConstituencyViewSet, VehicleCategoryViewSet,
        ParliamentSessionViewSet, SessionAttendanceViewSet, BeneficiaryProfileViewSet,
        FuelEntitlementViewSet, ProgramViewSet,
        
        # Subcenter management ViewSets
        PoolVehicleViewSet, DriverViewSet, VehicleAssignmentViewSet,
        
        # Fuel requirements management ViewSet
        FuelRequirementConfigurationViewSet,
        
        # Dispatch and allocation ViewSets
        BookDispatchViewSet, CouponAllocationViewSet,
        
        # System management ViewSets
        SystemAlertViewSet, AuditLogViewSet,
        
        # Business Central integration - moved from views_bc to views_main
        test_business_central_connection,
        
        # CORS test views
        cors_test, health_check,
    )
except ImportError as e:
    print(f"Import error in fuel/urls.py: {e}")
    # Fallback imports will be handled by lazy loading
    pass

# Import debug views
from .views_debug import (
    test_azure_database,
    health_check as debug_health_check,
    migrations_status,
    model_health_check,
)

# Import CORS bypass views
from .cors_test_views import cors_bypass_login, cors_test_endpoint

# Import home views that provide some of the missing endpoints
from .views_home import home_stats, system_health, recent_activity
from .views_home import home_stats, recent_activity, system_health, quick_insights

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

# Export and print views
# Commented out for deployment optimization - imports with pandas/pillow dependencies
# from .views_export import (
#     export_coupons, export_transactions, export_users, export_beneficiaries,
#     export_books, print_coupon, print_handover_report, export_dashboard_data,
#     download_template
# )

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

# Fuel requirements management
router.register(r'fuel-requirements', FuelRequirementConfigurationViewSet, basename='fuel-requirement')

# System management
router.register(r'system-alerts', SystemAlertViewSet, basename='system-alert')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

# Programs and attendance
router.register(r'programs', ProgramViewSet, basename='program')
# router.register(r'attendances', AttendanceViewSet, basename='attendance')  # TODO: Commented out - no Attendance model

urlpatterns = [
    # Authentication
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Add refresh endpoint
    path('auth/user/', user_profile_view, name='current-user'),  # Add user profile endpoint
    path('auth/roles/', get_view_function('auth_roles'), name='auth-roles'),  # Available user roles
    path('users/me/', user_profile_view, name='user-me'),  # Alternative endpoint for current user
    # Change password (no hard-coded api/v1 here; config/urls.py adds the prefix)
    path('auth/change-password/', change_password, name='change-password-v1'),
    
    # CORS bypass endpoints for debugging
    path('auth/login-bypass/', cors_bypass_login, name='login-bypass'),
    path('cors-test/', cors_test_endpoint, name='cors-test-endpoint'),
    
    # Home page APIs - keep relative paths; config adds /api/v1
    path('home/stats/', home_stats, name='home-stats'),
    path('home/health/', system_health, name='home-health'),
    path('home/activity/', recent_activity, name='home-activity'),
    path('home/insights/', quick_insights, name='home-insights'),
    
    # Admin dashboard endpoints - use relative paths
    path('admin/dashboard/', admin_dashboard, name='admin-dashboard-v1'),
    path('dashboard/', main_dashboard, name='main-dashboard-v1'),
    
    # Fuel statistics endpoint
    path('fuel-stats/', fuel_statistics, name='fuel-statistics'),
    
    # Notification endpoints
    path('notifications/stats/', notification_stats, name='notification-stats'),
    path('notifications/mark-all-read/', mark_all_notifications_read, name='notifications-mark-all-read'),
    
    # Analytics endpoints - keep relative paths only
    path('analytics/', analytics_view, name='analytics-view'),
    path('analytics/consumption-trend/', analytics_consumption_trend, name='consumption-trend-analytics'),
    path('analytics/fuel-requirements/', fuel_statistics, name='fuel-requirements-analytics'),
    path('financial-analytics/', analytics_view, name='financial-analytics'),
    path('statistics/', fuel_statistics, name='statistics'),  # General statistics endpoint
    
    # Fuel pricing and statistics endpoints
    path('fuel-stats/', fuel_statistics, name='fuel-statistics'),
    path('fuel-prices/', fuel_statistics, name='fuel-prices'),
    
    # SubCenter statistics endpoint
    path('subcenters/stats/', get_view_function('subcenters_stats'), name='subcenters-stats'),
    
    # Users endpoints with role filtering
    path('users/me/', UserViewSet.as_view({'get': 'me'}), name='user-me'),
    path('users/stats/', UserViewSet.as_view({'get': 'stats'}), name='user-stats'),
    
    # Books endpoints
    path('books/received/', BookViewSet.as_view({'get': 'received'}), name='books-received-v1'),
    
    # Dynamic allocation endpoint
    path('dynamic-allocation/', dynamic_allocation, name='dynamic-allocation'),
    
    # Router endpoints for missing paths
    path('subcenters/', SubCenterViewSet.as_view({'get': 'list'}), name='subcenters-list'),
    path('sub-centers/', SubCenterViewSet.as_view({'get': 'list'}), name='sub-centers-list'),  # Alternative path
    
    # Beneficiaries endpoints - full CRUD support
    path('beneficiaries/', BeneficiaryProfileViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='beneficiaries-list'),
    path('beneficiaries/<int:pk>/', BeneficiaryProfileViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
        'put': 'update',
        'delete': 'destroy'
    }), name='beneficiaries-detail'),
    path('beneficiaries/<int:pk>/activate/', BeneficiaryProfileViewSet.as_view({
        'post': 'activate'
    }), name='beneficiaries-activate'),
    path('beneficiaries/<int:pk>/deactivate/', BeneficiaryProfileViewSet.as_view({
        'post': 'deactivate'
    }), name='beneficiaries-deactivate'),
    path('beneficiaries/<int:pk>/allocation-history/', BeneficiaryProfileViewSet.as_view({
        'get': 'allocation_history'
    }), name='beneficiaries-allocation-history'),
    path('beneficiaries/categories/', BeneficiaryProfileViewSet.as_view({
        'get': 'categories'
    }), name='beneficiaries-categories'),
    path('beneficiaries/constituencies/', BeneficiaryProfileViewSet.as_view({
        'get': 'constituencies'
    }), name='beneficiaries-constituencies'),
    path('beneficiaries/stats/', BeneficiaryProfileViewSet.as_view({
        'get': 'stats'
    }), name='beneficiaries-stats'),
    
    # Audit endpoints
    path('audit-logs/', AuditLogViewSet.as_view({'get': 'list'}), name='audit-logs'),
    path('audit-logs/filter-options/', AuditLogViewSet.as_view({'get': 'filter_options'}), name='audit-filter-options'),
    path('audit/compliance-stats/', AuditLogViewSet.as_view({'get': 'compliance_stats'}), name='audit-compliance-stats'),
    path('audit/compliance-reports/', AuditLogViewSet.as_view({'get': 'compliance_reports'}), name='audit-compliance-reports'),
    path('audit/transaction-stats/', AuditLogViewSet.as_view({'get': 'transaction_stats'}), name='audit-transaction-stats'),
    path('audit/transactions/', AuditLogViewSet.as_view({'get': 'transactions'}), name='audit-transactions'),
    
    # Subcenter endpoints - use relative paths
    path('subcenters/overview/', SubCenterViewSet.as_view({'get': 'overview'}), name='subcenter-overview'),
    path('subcenters/activities/', SubCenterViewSet.as_view({'get': 'activities'}), name='subcenter-activities'),
    # General subcenter statistics endpoint - Using new function-based view
    path('subcenter/statistics/', subcenter_statistics, name='subcenter-statistics-v1'),
    path('subcenters/stats/', get_view_function('subcenters_stats'), name='subcenters-stats'),  # Frontend stats endpoint
    # Individual subcenter statistics endpoint
    path('subcenters/<int:pk>/statistics/', SubCenterViewSet.as_view({'get': 'statistics'}), name='subcenter-detail-statistics'),
    
    # Business Central Production Integration
    path('api/bc/webhook/', bc_webhook, name='bc-webhook'),
    path('api/bc/dashboard-data/', bc_dashboard_data, name='bc-dashboard-data'),
    path('api/bc/transaction/<int:transaction_id>/approve/', bc_transaction_approve, name='bc-transaction-approve'),
    path('api/bc/health/', bc_health_check, name='bc-health-check'),
    path('bc/dashboard/', BCDashboardView.as_view(), name='bc-dashboard'),
    
    # Business Central integration
    path('business-central/test/', test_business_central_connection, name='test-business-central'),
    
    # CORS and health test endpoints
    path('api/cors-test/', cors_test, name='cors-test'),
    path('api/health/', health_check, name='health-check'),
    
    # Debug endpoints for Azure testing
    path('api/debug/azure-db/', test_azure_database, name='test-azure-database'),
    path('api/debug/health/', debug_health_check, name='debug-health-check'),
    path('api/debug/migrations/', migrations_status, name='debug-migrations-status'),
    path('api/debug/model-health/', model_health_check, name='debug-model-health'),
    
    # Setup endpoints for initial deployment
    path('api/setup/database-status/', database_status_api, name='database-status'),
    path('api/setup/create-superuser/', create_superuser_api, name='create-superuser'),
    
    # Export and Download endpoints - Commented out for deployment optimization
    # path('api/export/coupons/', export_coupons, name='export-coupons'),
    # path('api/export/transactions/', export_transactions, name='export-transactions'),
    # path('api/export/users/', export_users, name='export-users'),
    # path('api/export/beneficiaries/', export_beneficiaries, name='export-beneficiaries'),
    # path('api/export/books/', export_books, name='export-books'),
    # path('api/export/dashboard/', export_dashboard_data, name='export-dashboard'),
    # path('api/export/template/', download_template, name='download-template'),
    
    # Print endpoints - Commented out for deployment optimization
    # path('api/print/coupon/', print_coupon, name='print-coupon'),
    # path('api/print/handover/', print_handover_report, name='print-handover'),
    
    # Include profile URLs 
    path('', include('fuel.urls_profile')),
    
    # Dynamic Fuel Allocation System URLs
    path('dynamic-allocation/', include('fuel.dynamic_allocation_urls')),
    
    # Include router URLs 
    path('', include(router.urls)),
]
