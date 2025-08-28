#!/usr/bin/env python3
"""
Test specific user and audit log data
"""
import os
import sys
import django

sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from fuel.models import AuditLog

User = get_user_model()

print("Checking audit logs and user data...")

# Check admin user data
admin_user = User.objects.get(username='admin')
print(f"Admin user: {admin_user}")
print(f"Admin user role: {admin_user.role}")
print(f"Admin user sub_center: {getattr(admin_user, 'sub_center', 'No sub_center field')}")

# Check all audit logs with their user details
audit_logs = AuditLog.objects.all().order_by('-created')
print(f"\nTotal audit logs: {audit_logs.count()}")

for i, log in enumerate(audit_logs[:5], 1):
    print(f"\n{i}. Audit Log:")
    print(f"   Action: {log.action}")
    print(f"   Description: {log.description}")
    print(f"   User: {log.user}")
    print(f"   User ID: {log.user.id if log.user else 'None'}")
    print(f"   Created: {log.created}")
    print(f"   Object: {log.object_repr}")

# Check if testuser exists
try:
    testuser = User.objects.get(username='testuser')
    print(f"\nTest user: {testuser}")
    print(f"Test user role: {testuser.role}")
    test_logs = AuditLog.objects.filter(user=testuser).count()
    print(f"Audit logs by testuser: {test_logs}")
except User.DoesNotExist:
    print("\nTestuser does not exist")
