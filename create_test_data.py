#!/usr/bin/env python
"""
Script to create test data for the fuel coupon system
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from fuel.models import User, Box
from django.contrib.auth.hashers import make_password
import datetime

def create_test_data():
    print("Creating test data...")
    
    # Create or get test user
    try:
        user = User.objects.get(username='testuser')
        print(f'✓ User found: {user.username}, ID: {user.id}')
    except User.DoesNotExist:
        print('Creating test user...')
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        print(f'✓ User created: {user.username}, ID: {user.id}')
    
    # Create test boxes
    boxes_created = 0
    for i in range(1, 6):  # Create 5 test boxes
        box_code = f'BOX{i:03d}'
        box, created = Box.objects.get_or_create(
            box_code=box_code,
            defaults={
                'supplier': f'Test Supplier {i}',
                'invoice_number': f'INV{i:03d}',
                'barcode': f'BC{i:03d}',
                'received_by': user,
                'received_date': datetime.date.today(),
                'status': 'received'
            }
        )
        if created:
            boxes_created += 1
        print(f'✓ Box {i} - ID: {box.id}, Code: {box.box_code}, Created: {created}')
    
    # Summary
    total_users = User.objects.count()
    total_boxes = Box.objects.count()
    
    print(f'\n=== SUMMARY ===')
    print(f'Total users in database: {total_users}')
    print(f'Total boxes in database: {total_boxes}')
    print(f'New boxes created: {boxes_created}')
    
    # List all boxes for verification
    print(f'\n=== ALL BOXES ===')
    for box in Box.objects.all():
        print(f'  Box ID {box.id}: {box.box_code} - {box.supplier} (Status: {box.status})')
    
    return total_boxes > 0

if __name__ == '__main__':
    success = create_test_data()
    if success:
        print('\n✅ Test data creation completed successfully!')
    else:
        print('\n❌ Test data creation failed!')
