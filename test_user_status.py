#!/usr/bin/env python
"""
Test script to check user approval status and test email functionality
"""
import os
import django
import sys

# Setup Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User

def check_user_status():
    print('=== User Approval Status ===')
    
    # Pending users
    pending_users = User.objects.filter(is_approved=False, rejection_reason__isnull=True)
    print(f'Pending users: {pending_users.count()}')
    for user in pending_users[:5]:
        print(f'- {user.username} | Email: {user.email or "No email"} | Role: {user.role}')

    # Approved users
    approved_users = User.objects.filter(is_approved=True)
    print(f'\nApproved users: {approved_users.count()}')
    for user in approved_users[:3]:
        print(f'- {user.username} | Email: {user.email or "No email"} | Last login: {user.last_login}')

    # Users with email addresses
    users_with_email = User.objects.filter(email__isnull=False).exclude(email='')
    print(f'\nUsers with email addresses: {users_with_email.count()}')
    for user in users_with_email[:3]:
        print(f'- {user.username} | Email: {user.email} | Approved: {user.is_approved}')

if __name__ == '__main__':
    check_user_status()
