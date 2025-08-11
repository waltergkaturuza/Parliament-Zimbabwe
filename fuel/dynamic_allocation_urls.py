"""
Dynamic Fuel Allocation System - URL Configuration

URL patterns for the Dynamic Fuel Allocation System API endpoints.
Provides RESTful routes for all allocation-related operations.
"""

from django.urls import path
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

# URL patterns for Dynamic Fuel Allocation System
urlpatterns = [
    # Fuel Allocation Rules
    path('rules/', FuelAllocationRuleViewSet.as_view(), name='fuel-allocation-rules'),
    
    # Fuel Prices
    path('prices/', FuelPriceViewSet.as_view(), name='fuel-prices'),
    path('prices/current/', get_current_fuel_price, name='current-fuel-price'),
    
    # Allocation Calculations
    path('calculate/', AllocationCalculationView.as_view(), name='calculate-allocation'),
    path('preview/', BulkAllocationPreviewView.as_view(), name='preview-allocations'),
    path('commit/', CommitAllocationView.as_view(), name='commit-allocations'),
    
    # Analytics and Reports
    path('analytics/', AllocationAnalyticsView.as_view(), name='allocation-analytics'),
    
    # Beneficiary Operations
    path('beneficiaries/<int:beneficiary_id>/history/', 
         get_beneficiary_allocation_history, 
         name='beneficiary-allocation-history'),
    
    # Rule Operations
    path('rules/applicable/', get_applicable_rules, name='applicable-rules'),
]
