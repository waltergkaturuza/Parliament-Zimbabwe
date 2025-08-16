#!/usr/bin/env python
"""
Test email functionality for user approval
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

django.setup()

from fuel.models import User, SubCenter
from fuel.email_utils import send_user_approval_email, send_user_rejection_email
import json

def test_email_functionality():
    print("=== Testing Email Functionality ===")
    
    # Create a test subcenter first
    subcenter, created = SubCenter.objects.get_or_create(
        name="Test SubCenter",
        defaults={
            'location': 'Test Location',
            'contact_person': 'Test Manager',
            'phone': '+263123456789',
            'is_active': True
        }
    )
    if created:
        print(f"✓ Created test subcenter: {subcenter.name}")
    else:
        print(f"✓ Using existing subcenter: {subcenter.name}")
    
    # Create a test user for approval
    test_user_data = {
        'username': 'test_user_approval',
        'email': 'test.user@parliament.gov.zw',
        'first_name': 'Test',
        'last_name': 'User',
        'role': 'SUB_CENTER',
        'phone': '+263123456789',
        'national_id': 'TEST123456789',
        'sub_center': subcenter,
        'is_approved': False,
        'is_active': False
    }
    
    # Delete existing test user if exists
    User.objects.filter(username='test_user_approval').delete()
    
    # Create test user
    test_user = User.objects.create_user(
        username=test_user_data['username'],
        email=test_user_data['email'],
        password='testpass123',
        first_name=test_user_data['first_name'],
        last_name=test_user_data['last_name'],
        role=test_user_data['role'],
        phone=test_user_data['phone'],
        national_id=test_user_data['national_id'],
        sub_center=test_user_data['sub_center'],
        is_approved=test_user_data['is_approved'],
        is_active=test_user_data['is_active']
    )
    
    print(f"✓ Created test user: {test_user.username} ({test_user.email})")
    
    # Get admin user for approval
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.filter(role='ADMIN').first()
    
    if not admin_user:
        print("⚠ Warning: No admin user found, creating one for test")
        admin_user = User.objects.create_superuser(
            username='admin_test',
            email='admin@parliament.gov.zw',
            password='admin123',
            role='ADMIN'
        )
    
    print(f"✓ Using admin user: {admin_user.username}")
    
    # Test 1: Approval Email
    print("\n=== Testing Approval Email ===")
    try:
        success, temp_password = send_user_approval_email(test_user, admin_user)
        if success:
            print(f"✅ Approval email sent successfully!")
            print(f"   Temporary password generated: {temp_password}")
            print("   Check the console output above for the email content")
        else:
            print("❌ Failed to send approval email")
    except Exception as e:
        print(f"❌ Error sending approval email: {e}")
    
    # Test 2: Test user statistics
    print("\n=== Testing User Statistics ===")
    try:
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        approved_users = User.objects.filter(is_approved=True).count()
        pending_users = User.objects.filter(is_approved=False, rejection_reason__isnull=True).count()
        
        print(f"✓ Total users: {total_users}")
        print(f"✓ Active users: {active_users}")
        print(f"✓ Approved users: {approved_users}")
        print(f"✓ Pending users: {pending_users}")
        
    except Exception as e:
        print(f"❌ Error getting statistics: {e}")
    
    # Test 3: Rejection Email (create another user for this)
    print("\n=== Testing Rejection Email ===")
    try:
        # Create another test user for rejection
        User.objects.filter(username='test_user_rejection').delete()
        
        rejection_user = User.objects.create_user(
            username='test_user_rejection',
            email='test.rejection@parliament.gov.zw',
            password='testpass123',
            first_name='Rejection',
            last_name='Test',
            role='BENEFICIARY',
            phone='+263987654321',
            national_id='REJ123456789',
            is_approved=False,
            is_active=False
        )
        
        print(f"✓ Created rejection test user: {rejection_user.username}")
        
        # Send rejection email
        success = send_user_rejection_email(
            rejection_user, 
            "Invalid documents provided", 
            admin_user
        )
        
        if success:
            print("✅ Rejection email sent successfully!")
            print("   Check the console output above for the email content")
        else:
            print("❌ Failed to send rejection email")
            
    except Exception as e:
        print(f"❌ Error testing rejection email: {e}")
    
    print("\n=== Email Test Complete ===")
    print("Note: With console email backend, emails are printed to console instead of being sent via SMTP")
    print("This is perfect for development and testing!")

if __name__ == '__main__':
    test_email_functionality()
