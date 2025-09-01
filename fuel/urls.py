from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from django.views.decorators.csrf import csrf_exempt

# Use lazy imports to avoid circular import issues
def get_view_function(view_name):
    """Backward-compatible alias that returns a lazy resolver for a function view."""
    return lazy_view(view_name)

def lazy_view(view_name):
    """Return a function-based view that resolves target on first request."""
    def _view(request, *args, **kwargs):
        try:
            from . import views_main
            view = getattr(views_main, view_name)
            return view(request, *args, **kwargs)
        except Exception as e:
            return JsonResponse({
                'detail': f'Endpoint temporarily unavailable: {view_name}',
                'error': str(e)
            }, status=503)
    return _view

def lazy_class_view(class_name):
    """Wrap a class-based view by resolving .as_view() at request time."""
    def _view(request, *args, **kwargs):
        try:
            from . import views_main
            cls = getattr(views_main, class_name)
            view = getattr(cls, 'as_view')()
            return view(request, *args, **kwargs)
        except Exception as e:
            return JsonResponse({
                'detail': f'Endpoint temporarily unavailable: {class_name}',
                'error': str(e)
            }, status=503)
    return _view

def lazy_viewset_action(viewset_name, actions):
    """Wrap a ViewSet action by resolving class and .as_view(actions) at request time."""
    def _view(request, *args, **kwargs):
        try:
            from . import views_main
            vs = getattr(views_main, viewset_name)
            view = vs.as_view(actions)
            return view(request, *args, **kwargs)
        except Exception as e:
            return JsonResponse({
                'detail': f'Endpoint temporarily unavailable: {viewset_name} action',
                'error': str(e)
            }, status=503)
    return _view

def safe_get_viewset(name: str):
    """Try to import a ViewSet from views_main; return None if unavailable."""
    try:
        from . import views_main
        return getattr(views_main, name)
    except Exception as e:
        print(f"Skipping router for {name}: {e}")
        return None

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
        PoliticalPartyViewSet, ParliamentSessionViewSet, SessionAttendanceViewSet, 
        BeneficiaryProfileViewSet, FuelEntitlementViewSet, ProgramViewSet,
        
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

def _maybe_register(name: str, route: str, basename: str):
    vs = safe_get_viewset(name)
    if vs:
        router.register(route, vs, basename=basename)

# User management
_maybe_register('UserViewSet', r'users', 'user')
_maybe_register('SubCenterViewSet', r'subcenters', 'subcenter')
_maybe_register('SubCenterViewSet', r'sub-centers', 'subcenter-alias')  # Alias for frontend compatibility

# Coupon management
_maybe_register('BoxViewSet', r'boxes', 'box')
_maybe_register('BookViewSet', r'books', 'book')
_maybe_register('CouponViewSet', r'coupons', 'coupon')

# Dispatch and allocation management
_maybe_register('BookDispatchViewSet', r'dispatches', 'dispatch')
_maybe_register('CouponAllocationViewSet', r'allocations', 'allocation')

# Parliament-specific entities
_maybe_register('BeneficiaryCategoryViewSet', r'beneficiary-categories', 'beneficiary-category')
_maybe_register('ConstituencyViewSet', r'constituencies', 'constituency')
_maybe_register('VehicleCategoryViewSet', r'vehicle-categories', 'vehicle-category')
_maybe_register('PoliticalPartyViewSet', r'political-parties', 'political-party')
_maybe_register('ParliamentSessionViewSet', r'parliament-sessions', 'parliament-session')
_maybe_register('SessionAttendanceViewSet', r'session-attendances', 'session-attendance')
_maybe_register('BeneficiaryProfileViewSet', r'beneficiary-profiles', 'beneficiary-profile')
_maybe_register('FuelEntitlementViewSet', r'fuel-entitlements', 'fuel-entitlement')

# Subcenter management
_maybe_register('PoolVehicleViewSet', r'pool-vehicles', 'pool-vehicle')
_maybe_register('DriverViewSet', r'drivers', 'driver')
_maybe_register('VehicleAssignmentViewSet', r'vehicle-assignments', 'vehicle-assignment')

# Fuel requirements management
_maybe_register('FuelRequirementConfigurationViewSet', r'fuel-requirements', 'fuel-requirement')

# System management
_maybe_register('SystemAlertViewSet', r'system-alerts', 'system-alert')
_maybe_register('AuditLogViewSet', r'audit-logs', 'audit-log')

# Programs and attendance
_maybe_register('ProgramViewSet', r'programs', 'program')
# router.register(r'attendances', AttendanceViewSet, basename='attendance')  # TODO: Commented out - no Attendance model

# Attendance Management System (Sergeant of Arms)
_maybe_register('SessionAttendanceRegistryViewSet', r'attendance-registries', 'attendance-registry')
_maybe_register('AttendanceRegistryMemberViewSet', r'attendance-members', 'attendance-member')
_maybe_register('AttendanceCorrectionViewSet', r'attendance-corrections', 'attendance-correction')

urlpatterns = [
    # Authentication
    path('auth/register/', csrf_exempt(lazy_class_view('RegisterView')), name='register'),
    path('auth/login/', csrf_exempt(lazy_class_view('LoginView')), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Add refresh endpoint
    path('auth/user/', lazy_view('user_profile_view'), name='current-user'),  # Add user profile endpoint
    path('auth/roles/', lazy_view('auth_roles'), name='auth-roles'),  # Available user roles
    path('users/me/', lazy_view('user_profile_view'), name='user-me'),  # Alternative endpoint for current user
    # Change password (no hard-coded api/v1 here; config/urls.py adds the prefix)
    path('auth/change-password/', lazy_view('change_password'), name='change-password-v1'),
    
    # CORS bypass endpoints for debugging
    path('auth/login-bypass/', cors_bypass_login, name='login-bypass'),
    path('cors-test/', cors_test_endpoint, name='cors-test-endpoint'),
    
    # Home page APIs - keep relative paths; config adds /api/v1
    path('home/stats/', home_stats, name='home-stats'),
    path('home/health/', system_health, name='home-health'),
    path('home/activity/', recent_activity, name='home-activity'),
    path('home/insights/', quick_insights, name='home-insights'),
    
    # Admin dashboard endpoints - use relative paths
    path('admin/dashboard/', lazy_view('admin_dashboard'), name='admin-dashboard-v1'),
    path('dashboard/', lazy_view('main_dashboard'), name='main-dashboard-v1'),
    
    # Sergeant of Arms dashboard
    path('sergeant-of-arms/dashboard/', lazy_class_view('SergeantOfArmsDashboardAPIView'), name='sergeant-of-arms-dashboard'),
    
    # Fuel statistics endpoint
    path('fuel-stats/', lazy_view('fuel_statistics'), name='fuel-statistics'),
    
    # Notification endpoints
    path('notifications/stats/', lazy_view('notification_stats'), name='notification-stats'),
    path('notifications/mark-all-read/', lazy_view('mark_all_notifications_read'), name='notifications-mark-all-read'),
    
    # Analytics endpoints - keep relative paths only
    path('analytics/', lazy_view('analytics_view'), name='analytics-view'),
    path('analytics/consumption-trend/', lazy_view('analytics_consumption_trend'), name='consumption-trend-analytics'),
    # New analytics endpoints
    path('analytics/received-breakdown/', get_view_function('analytics_received_breakdown'), name='analytics-received-breakdown'),
    path('analytics/available-by-center/', get_view_function('analytics_available_by_center'), name='analytics-available-by-center'),
    path('analytics/dispatches-timeline/', get_view_function('analytics_dispatches_timeline'), name='analytics-dispatches-timeline'),
    path('analytics/fuel-requirements/', lazy_view('fuel_statistics'), name='fuel-requirements-analytics'),
    path('financial-analytics/', lazy_view('analytics_view'), name='financial-analytics'),
    path('statistics/', lazy_view('fuel_statistics'), name='statistics'),  # General statistics endpoint
    
    # Fuel pricing and statistics endpoints
    path('fuel-stats/', lazy_view('fuel_statistics'), name='fuel-statistics'),
    path('fuel-prices/', lazy_view('fuel_statistics'), name='fuel-prices'),
    
    # SubCenter statistics endpoint
    path('subcenters/stats/', lazy_view('subcenters_stats'), name='subcenters-stats'),
    
    # Users endpoints with role filtering
    path('users/me/', lazy_viewset_action('UserViewSet', {'get': 'me'}), name='user-me'),
    path('users/stats/', lazy_viewset_action('UserViewSet', {'get': 'stats'}), name='user-stats'),
    
    # Books endpoints
    path('books/received/', lazy_viewset_action('BookViewSet', {'get': 'received'}), name='books-received-v1'),
    
    # Dynamic allocation endpoint
    path('dynamic-allocation/', lazy_view('dynamic_allocation'), name='dynamic-allocation'),
    
    # Router endpoints for missing paths
    path('subcenters/', lazy_viewset_action('SubCenterViewSet', {'get': 'list'}), name='subcenters-list'),
    path('sub-centers/', lazy_viewset_action('SubCenterViewSet', {'get': 'list'}), name='sub-centers-list'),  # Alternative path
    
    # Beneficiaries endpoints - full CRUD support
    path('beneficiaries/', lazy_viewset_action('BeneficiaryProfileViewSet', {
        'get': 'list',
        'post': 'create'
    }), name='beneficiaries-list'),
    path('beneficiaries/<int:pk>/', lazy_viewset_action('BeneficiaryProfileViewSet', {
        'get': 'retrieve',
        'patch': 'partial_update',
        'put': 'update',
        'delete': 'destroy'
    }), name='beneficiaries-detail'),
    path('beneficiaries/<int:pk>/activate/', lazy_viewset_action('BeneficiaryProfileViewSet', {
        'post': 'activate'
    }), name='beneficiaries-activate'),
    path('beneficiaries/<int:pk>/deactivate/', lazy_viewset_action('BeneficiaryProfileViewSet', {
        'post': 'deactivate'
    }), name='beneficiaries-deactivate'),
    path('beneficiaries/<int:pk>/allocation-history/', lazy_viewset_action('BeneficiaryProfileViewSet', {
        'get': 'allocation_history'
    }), name='beneficiaries-allocation-history'),
    path('beneficiaries/categories/', lazy_viewset_action('BeneficiaryProfileViewSet', {
        'get': 'categories'
    }), name='beneficiaries-categories'),
    path('beneficiaries/constituencies/', lazy_viewset_action('BeneficiaryProfileViewSet', {
        'get': 'constituencies'
    }), name='beneficiaries-constituencies'),
    path('beneficiaries/stats/', lazy_viewset_action('BeneficiaryProfileViewSet', {
        'get': 'stats'
    }), name='beneficiaries-stats'),
    
    # Audit endpoints
    path('audit-logs/', lazy_viewset_action('AuditLogViewSet', {'get': 'list'}), name='audit-logs'),
    path('audit-logs/filter-options/', lazy_viewset_action('AuditLogViewSet', {'get': 'filter_options'}), name='audit-filter-options'),
    path('audit-logs/export-audit-data/', lazy_viewset_action('AuditLogViewSet', {'post': 'export_audit_data'}), name='audit-export-data'),
    path('audit/compliance-stats/', lazy_viewset_action('AuditLogViewSet', {'get': 'compliance_stats'}), name='audit-compliance-stats'),
    path('audit/compliance-reports/', lazy_viewset_action('AuditLogViewSet', {'get': 'compliance_reports', 'post': 'compliance_reports'}), name='audit-compliance-reports'),
    path('audit/transaction-stats/', lazy_viewset_action('AuditLogViewSet', {'get': 'transaction_stats'}), name='audit-transaction-stats'),
    path('audit/transactions/', lazy_viewset_action('AuditLogViewSet', {'get': 'transactions'}), name='audit-transactions'),
    path('audit/security-events/', lazy_viewset_action('AuditLogViewSet', {'get': 'security_events'}), name='audit-security-events'),
    
    # Subcenter endpoints - use relative paths
    path('subcenters/overview/', lazy_viewset_action('SubCenterViewSet', {'get': 'overview'}), name='subcenter-overview'),
    path('subcenters/activities/', lazy_viewset_action('SubCenterViewSet', {'get': 'activities'}), name='subcenter-activities'),
    path('subcenters/monitoring/', lazy_viewset_action('SubCenterViewSet', {'get': 'monitoring'}), name='subcenter-monitoring'),
    # General subcenter statistics endpoint - Using new function-based view
    path('subcenter/statistics/', lazy_view('subcenter_statistics'), name='subcenter-statistics-v1'),
    path('subcenters/stats/', lazy_view('subcenters_stats'), name='subcenters-stats'),  # Frontend stats endpoint
    # Individual subcenter statistics endpoint
    path('subcenters/<int:pk>/statistics/', lazy_viewset_action('SubCenterViewSet', {'get': 'statistics'}), name='subcenter-detail-statistics'),
    # Individual subcenter recent activity endpoint
    path('subcenters/<int:pk>/recent_activity/', lazy_viewset_action('SubCenterViewSet', {'get': 'recent_activity'}), name='subcenter-detail-recent-activity'),
    
    # Business Central Production Integration
    path('api/bc/webhook/', bc_webhook, name='bc-webhook'),
    path('api/bc/dashboard-data/', bc_dashboard_data, name='bc-dashboard-data'),
    path('api/bc/transaction/<int:transaction_id>/approve/', bc_transaction_approve, name='bc-transaction-approve'),
    path('api/bc/health/', bc_health_check, name='bc-health-check'),
    path('bc/dashboard/', BCDashboardView.as_view(), name='bc-dashboard'),
    
    # Business Central integration
    path('business-central/test/', lazy_view('test_business_central_connection'), name='test-business-central'),
    
    # CORS and health test endpoints
    path('api/cors-test/', lazy_view('cors_test'), name='cors-test'),
    path('api/health/', lazy_view('health_check'), name='health-check'),
    
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
