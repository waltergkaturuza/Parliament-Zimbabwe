#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, r'C:\Users\Administrator\Parliament-Zimbabwe\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parliament_fuel_system.settings')
django.setup()

from fuel.models import Box
from fuel.services.book_generation import BookGenerationService

# Create a simple test box
box = Box.objects.create(
    box_code="DEBUG-TEST",
    fuel_type="DIESEL",
    denomination=20,
    number_of_books=10,
    status="RECEIVED"
)

print(f"Created box: {box.id}")

# Test validation
validation = BookGenerationService.validate_generation_request(
    box_id=box.id,
    first_serial="PU006H1355101",
    last_serial="PU006H1356100",
    books_per_box=10,
    coupons_per_book=100,
    force=False
)

print(f"Validation result: {validation}")

if not validation['valid']:
    print("ERRORS:", validation['errors'])
    print("WARNINGS:", validation['warnings'])
else:
    print("Validation passed!")

# Cleanup
box.delete()
print("Cleaned up test box")
