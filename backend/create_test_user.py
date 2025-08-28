#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User

# Create or update admin user
user, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'is_superuser': True,
        'is_staff': True,
        'email': 'admin@parliament.gov.zw'
    }
)
user.set_password('admin123')
user.save()

print(f'User admin: {"created" if created else "updated"}')
print(f'Admin user ID: {user.id}')
print(f'Is superuser: {user.is_superuser}')
print(f'Is staff: {user.is_staff}')
