#!/usr/bin/env python
"""
Test script to verify SystemAlert enhanced functionality
"""
import os
import sys
import django

# Add project root to path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')
django.setup()

from fuel.models import SystemAlert, User
from django.utils import timezone
from datetime import timedelta
import json

def test_systemalert_functionality():
    print("=== Testing SystemAlert Enhanced Functionality ===")
    
    # Check if enhanced fields exist
    try:
        # Test creating an alert with new fields
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            print("No admin user found. Creating one...")
            admin_user = User.objects.create_superuser(
                username='testadmin',
                email='admin@test.com',
                password='testpass123'
            )
        
        # Create test alert with enhanced fields
        test_alert = SystemAlert.objects.create(
            title="Test Enhanced Alert",
            message="This is a test alert with enhanced functionality.",
            alert_type="INFO",
            priority=2,
            target_roles=["MAIN_CENTER"],
            expires_at=timezone.now() + timedelta(hours=24),
            is_dismissible=True,
            created_by=admin_user
        )
        
        print(f"✅ Successfully created enhanced SystemAlert: {test_alert.title}")
        print(f"   Priority: {test_alert.priority}")
        print(f"   Target Roles: {test_alert.target_roles}")
        print(f"   Expires At: {test_alert.expires_at}")
        print(f"   Is Dismissible: {test_alert.is_dismissible}")
        
        # Test the model methods
        print(f"   Is Expired: {test_alert.is_expired}")
        print(f"   Is Active: {test_alert.is_active}")
        
        # Test the class method
        alert2 = SystemAlert.create_alert(
            title="Class Method Test",
            message="Testing class method creation",
            alert_type="WARNING",
            priority=3,
            created_by=admin_user
        )
        print(f"✅ Successfully created alert using class method: {alert2.title}")
        
        # Test acknowledgment
        test_alert.acknowledge(admin_user)
        print(f"✅ Successfully acknowledged alert: {test_alert.status}")
        
        # Test resolution
        alert2.resolve()
        print(f"✅ Successfully resolved alert: {alert2.status}")
        
        # Show alert count
        total_alerts = SystemAlert.objects.count()
        print(f"✅ Total alerts in database: {total_alerts}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing SystemAlert functionality: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_systemalert_functionality()
    if success:
        print("\n🎉 All SystemAlert enhanced functionality tests passed!")
    else:
        print("\n❌ Some tests failed!")
