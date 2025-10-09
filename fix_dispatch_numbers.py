#!/usr/bin/env python
import os
import sys
import django

# Setup Django
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.append(backend_path)
os.chdir(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from fuel.models import BookDispatch

# Fix duplicate main_center_dispatch_numbers
print("Fixing main_center_dispatch_numbers...")

dispatches = BookDispatch.objects.all()
for i, dispatch in enumerate(dispatches, 1):
    # Create unique dispatch number
    new_number = f"MCD-{dispatch.id:05d}-{i:03d}"
    old_number = dispatch.main_center_dispatch_number
    dispatch.main_center_dispatch_number = new_number
    dispatch.save(update_fields=['main_center_dispatch_number'])
    print(f"Updated dispatch {dispatch.id}: {old_number} -> {new_number}")

print("✅ Fixed main_center_dispatch_numbers")

# Now recalculate aggregates for all dispatches
print("Recalculating aggregates for all dispatches...")
for dispatch in dispatches:
    try:
        dispatch.recalculate_aggregates(save=True)
        print(f"✅ Dispatch {dispatch.id}: Updated aggregates")
    except Exception as e:
        print(f"❌ Dispatch {dispatch.id}: Error - {e}")

print("✅ Completed aggregate recalculation")