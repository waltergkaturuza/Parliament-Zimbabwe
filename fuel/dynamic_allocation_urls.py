"""
Dynamic Fuel Allocation System - URL Configuration

URL patterns for the Dynamic Fuel Allocation System API endpoints.
Provides RESTful routes for all allocation-related operations.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.dynamic_allocation_views import (
    FuelAllocationRuleViewSet,
    FuelPriceViewSet,
    AllocationCalculationView,
    BulkAllocationPreviewView,
    CommitAllocationView,
    AllocationAnalyticsView,
    get_current_fuel_price,
    get_beneficiary_allocation_history,
    get_applicable_rules,
)

# Create router for ViewSets
router = DefaultRouter()
router.register(r'rules', FuelAllocationRuleViewSet, basename='fuel-allocation-rules')
router.register(r'prices', FuelPriceViewSet, basename='fuel-prices')

# URL patterns for Dynamic Fuel Allocation System
urlpatterns = [
    # Include router URLs (this handles rules/ and prices/ with full CRUD)
    path('', include(router.urls)),
    
    # Additional custom endpoints
    path('calculate/', AllocationCalculationView.as_view(), name='calculate-allocation'),
    path('preview/', BulkAllocationPreviewView.as_view(), name='preview-allocations'),
    path('commit/', CommitAllocationView.as_view(), name='commit-allocations'),
    
    # Analytics and Reports
    path('analytics/', AllocationAnalyticsView.as_view(), name='allocation-analytics'),
    
    # Beneficiary Operations
    path('beneficiaries/<int:beneficiary_id>/history/', 
         get_beneficiary_allocation_history, 
         name='beneficiary-allocation-history'),
]
