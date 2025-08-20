"""
Dynamic Fuel Allocation System - URL Configuration

This module uses lazy imports to avoid import-time errors during migrations or
when optional models aren't available yet.
"""

from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter


def _lazy_import():
    try:
        from .api import dynamic_allocation_views as v
        return v
    except Exception as e:
        # Print once on import; endpoints will degrade to 503 until available
        print(f"[dynamic_allocation_urls] Delayed import failed: {e}")
        return None


def lazy_view(view_name):
    def _view(request, *args, **kwargs):
        v = _lazy_import()
        if v is None:
            return JsonResponse({'detail': f'Endpoint temporarily unavailable: {view_name}'}, status=503)
        try:
            view = getattr(v, view_name)
            return view(request, *args, **kwargs)
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)
    return _view


def lazy_class_view(class_name):
    def _view(request, *args, **kwargs):
        v = _lazy_import()
        if v is None:
            return JsonResponse({'detail': f'Endpoint temporarily unavailable: {class_name}'}, status=503)
        try:
            cls = getattr(v, class_name)
            return cls.as_view()(request, *args, **kwargs)
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)
    return _view


def lazy_viewset_action(viewset_name, actions):
    def _view(request, *args, **kwargs):
        v = _lazy_import()
        if v is None:
            return JsonResponse({'detail': f'Endpoint temporarily unavailable: {viewset_name}'}, status=503)
        try:
            vs = getattr(v, viewset_name)
            return vs.as_view(actions)(request, *args, **kwargs)
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)
    return _view


def _maybe_register(router: DefaultRouter, viewset_name: str, route: str, basename: str):
    v = _lazy_import()
    if v is None:
        return
    try:
        vs = getattr(v, viewset_name)
        router.register(route, vs, basename=basename)
    except Exception as e:
        print(f"[dynamic_allocation_urls] Skipping router for {viewset_name}: {e}")


# Create router for ViewSets (conditionally registers if available)
router = DefaultRouter()
_maybe_register(router, 'FuelAllocationRuleViewSet', r'rules', 'fuel-allocation-rules')
_maybe_register(router, 'FuelPriceViewSet', r'prices', 'fuel-prices')


# URL patterns for Dynamic Fuel Allocation System
urlpatterns = [
    # Include router URLs (this handles rules/ and prices/ with full CRUD)
    path('', include(router.urls)),

    # Additional custom endpoints
    path('calculate/', lazy_class_view('AllocationCalculationView'), name='calculate-allocation'),
    path('preview/', lazy_class_view('BulkAllocationPreviewView'), name='preview-allocations'),
    path('commit/', lazy_class_view('CommitAllocationView'), name='commit-allocations'),

    # Analytics and Reports
    path('analytics/', lazy_class_view('AllocationAnalyticsView'), name='allocation-analytics'),

    # Beneficiary Operations
    path('beneficiaries/<int:beneficiary_id>/history/', \
         lazy_view('get_beneficiary_allocation_history'), \
         name='beneficiary-allocation-history'),
]
