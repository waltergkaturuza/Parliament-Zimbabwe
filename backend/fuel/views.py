# fuel/views.py - Main views module
"""
Main views module for the fuel coupon system.
This file imports all views from the modular view files for easy access.
"""

# Import all views from the main views module
from .views_main import *  # This includes all the main ViewSets and authentication views
from .views_bc import *    # This includes Business Central integration views

# Import specific views that might be needed elsewhere
from .views_main import (
    # Authentication views
    RegisterView,
    LoginView,
    
    # Main ViewSets
    UserViewSet,
    SubCenterViewSet,
    SubCenterOfficerViewSet,
    BoxViewSet,
    BookViewSet,
    CouponViewSet,
    CouponDistributionViewSet,
    FuelDataViewSet,
    FuelTransactionViewSet,
    HandoverViewSet,
    
    # Parliament-specific ViewSets
    BeneficiaryCategoryViewSet,
    ConstituencyViewSet,
    VehicleCategoryViewSet,
    ParliamentSessionViewSet,
    SessionAttendanceViewSet,
    BeneficiaryProfileViewSet,
    FuelEntitlementViewSet,
    
    # Vehicle management ViewSets
    PoolVehicleViewSet,
    DriverViewSet,
    VehicleAssignmentViewSet,
    
    # Dispatch ViewSets
    BookDispatchViewSet,
    CouponAllocationViewSet,
    
    # System ViewSets
    SystemAlertViewSet,
    AuditLogViewSet,
    
    # Admin views
    admin_dashboard,
    fuel_statistics,
    analytics_view,
    
    # Test views
    test_business_central_connection,
)

# Import Business Central views
from .views_bc import (
    BCEmbeddedDashboardView,
    bc_transaction_list,
    bc_transaction_form,
    bc_reports,
    bc_api_sync,
)

# Add a simple health check view for debugging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import connection
from django.conf import settings
import json

@csrf_exempt
@require_http_methods(["GET", "HEAD"])
def health_check(request):
    """
    Simple health check endpoint to verify the backend is running
    """
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    health_data = {
        "status": "healthy",
        "timestamp": "2025-01-30T17:30:00Z",
        "version": "1.0.0",
        "database": db_status,
        "debug": settings.DEBUG,
        "allowed_hosts": settings.ALLOWED_HOSTS,
        "cors_origins": getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
    }
    
    return JsonResponse(health_data, status=200)


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def cors_preflight_test(request):
    """
    CORS preflight test endpoint
    """
    response = JsonResponse({
        "method": request.method,
        "headers": dict(request.headers),
        "origin": request.META.get('HTTP_ORIGIN', 'None'),
        "cors_test": "success"
    })
    
    # Add CORS headers manually for testing
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
    response["Access-Control-Allow-Credentials"] = "true"
    
    return response
