#!/usr/bin/env python3
"""
Check dispatch statuses and fix them for testing
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import BookDispatch, SubCenter
from django.db import transaction

def check_and_fix_dispatch_statuses():
    """Check current dispatch statuses and simulate some deliveries"""
    print("🔍 DISPATCH STATUS CHECK & FIX")
    print("=" * 40)
    
    # Check current statuses
    dispatches = BookDispatch.objects.all()
    print(f"Total dispatches: {dispatches.count()}")
    
    for dispatch in dispatches:
        print(f"   {dispatch.main_center_dispatch_number}: {dispatch.status} → {dispatch.to_center.name if dispatch.to_center else 'None'}")
    
    print(f"\n🔧 Simulating deliveries for testing...")
    
    with transaction.atomic():
        # Mark some dispatches as delivered for testing
        dispatches_to_deliver = BookDispatch.objects.filter(
            to_center__isnull=False,
            status='DISPATCHED'
        )[:2]  # Deliver first 2 dispatches
        
        for dispatch in dispatches_to_deliver:
            dispatch.status = 'DELIVERED'
            dispatch.save()
            print(f"   ✅ Marked {dispatch.main_center_dispatch_number} as DELIVERED to {dispatch.to_center.name}")
        
        # Mark one more as RECEIVED
        received_dispatch = BookDispatch.objects.filter(
            to_center__isnull=False,
            status='DISPATCHED'
        ).first()
        
        if received_dispatch:
            received_dispatch.status = 'RECEIVED'
            received_dispatch.save()
            print(f"   ✅ Marked {received_dispatch.main_center_dispatch_number} as RECEIVED by {received_dispatch.to_center.name}")
    
    print(f"\n📊 Updated dispatch statuses:")
    for dispatch in BookDispatch.objects.all():
        print(f"   {dispatch.main_center_dispatch_number}: {dispatch.status} → {dispatch.to_center.name if dispatch.to_center else 'None'}")

if __name__ == "__main__":
    check_and_fix_dispatch_statuses()