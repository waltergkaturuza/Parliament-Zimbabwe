# fuel/views.py - Main views module
"""
Main views module for the fuel coupon system.
This file imports all views from the modular view files for easy access.
"""

# Import all views from the main views module
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
    CouponAllocationViewSet,  # This is the correct name, not CouponDistributionViewSet
    FuelTransactionViewSet,
    
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
    
    # System ViewSets
    SystemAlertViewSet,
    AuditLogViewSet,
    
    # Missing ViewSets - Added
    FuelDataViewSet,
    CouponDistributionViewSet,
    
    # Admin views
    admin_dashboard,
    fuel_statistics,
    analytics_view,
    
    # CORS and health check views
    cors_test,
    health_check,
    
    # Business Central test view
    test_business_central_connection,
)

# Import Business Central views
from .views_bc import *    # This includes Business Central integration views
