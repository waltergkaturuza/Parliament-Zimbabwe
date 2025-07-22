#!/usr/bin/env python3
"""
🏛️ Parliament of Zimbabwe Fuel Coupon System
👤 Create Admin User Script
"""

import os
import django
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from datetime import datetime

User = get_user_model()

def create_admin_user():
    """Create admin user for Parliament system"""
    print("=" * 80)
    print("🏛️  PARLIAMENT OF ZIMBABWE FUEL COUPON SYSTEM")
    print("👤 Creating Admin User")
    print("=" * 80)
    print(f"Creation Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Check if admin user already exists
        if User.objects.filter(username='admin').exists():
            print("✅ Admin user already exists!")
            admin_user = User.objects.get(username='admin')
            print(f"   👤 Username: {admin_user.username}")
            print(f"   📧 Email: {admin_user.email}")
            print(f"   🔒 Superuser: {admin_user.is_superuser}")
            return admin_user
        
        # Create new admin user
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@parliament.zw',
            password='ParliamentAdmin2025!',
            first_name='Parliament',
            last_name='Administrator'
        )
        
        # Make superuser
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        
        print("✅ Admin user created successfully!")
        print(f"   👤 Username: admin")
        print(f"   📧 Email: admin@parliament.zw")
        print(f"   🔒 Password: ParliamentAdmin2025!")
        print(f"   ⚡ Superuser: Yes")
        
        # Also create a test Parliament member
        if not User.objects.filter(username='mp_test').exists():
            mp_user = User.objects.create_user(
                username='mp_test',
                email='mp.test@parliament.zw',
                password='TestMP2025!',
                first_name='Test',
                last_name='MP'
            )
            print("\n✅ Test MP user created!")
            print(f"   👤 Username: mp_test")
            print(f"   📧 Email: mp.test@parliament.zw")
            print(f"   🔒 Password: TestMP2025!")
        
        return admin_user
        
    except Exception as e:
        print(f"❌ Failed to create admin user: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    user = create_admin_user()
    if user:
        print("\n" + "=" * 80)
        print("🎯 ADMIN USER READY!")
        print("🌐 You can now access:")
        print("   • Admin Interface: http://127.0.0.1:8000/admin/")
        print("   • Main System: http://127.0.0.1:8000/")
        print("=" * 80)
