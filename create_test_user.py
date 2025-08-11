#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from fuel.models import User, SubCenter

def create_test_data():
    # Check if any users exist
    print("Existing users:", User.objects.count())
    
    if User.objects.count() == 0:
        # Create a test user
        user = User.objects.create_user(
            username='admin',
            email='admin@parliament.gov.zw',
            password='admin123',
            first_name='Test',
            last_name='Admin'
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print("✅ Created test user: admin/admin123")
    else:
        print("ℹ️  Users already exist:")
        for user in User.objects.all()[:3]:
            print(f"  - {user.username} ({user.email})")

    # Check subcenters
    print("Existing subcenters:", SubCenter.objects.count())
    if SubCenter.objects.count() == 0:
        subcenter = SubCenter.objects.create(
            name='Main Parliament',
            code='MAIN'
        )
        print("✅ Created test subcenter: Main Parliament")
    else:
        print("ℹ️  Subcenters already exist")

    print("🎉 Setup complete!")
    print("\nYou can now login with:")
    print("Username: admin")
    print("Password: admin123")

if __name__ == '__main__':
    create_test_data()
