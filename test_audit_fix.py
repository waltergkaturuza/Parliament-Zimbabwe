#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('.')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
django.setup()

from fuel.models import AuditLog, User
from django.contrib.contenttypes.models import ContentType

print("Testing AuditLog model fields...")

# Check if we have any audit logs
count = AuditLog.objects.count()
print(f"Total audit logs: {count}")

# Check field names
field_names = [f.name for f in AuditLog._meta.get_fields()]
print(f"AuditLog field names: {field_names}")

# Test creating a simple audit log
try:
    # Get or create a content type for User
    content_type = ContentType.objects.get_for_model(User)
    
    # Create a test audit log
    audit_log = AuditLog.objects.create(
        content_type=content_type,
        object_id="123",
        object_repr="Test User",
        action="TEST",
        description="Test audit log entry",
        changes={"test": "data"},
        severity="LOW",
        is_system_action=True
    )
    
    print(f"Successfully created audit log: {audit_log}")
    print(f"Audit log created timestamp: {audit_log.created}")
    print(f"Audit log content type: {audit_log.content_type}")
    
    # Test the view logic
    from fuel.views import audit_transactions
    from django.test import RequestFactory
    from django.contrib.auth.models import AnonymousUser
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.get('/api/v1/audit/transactions/')
    request.user = AnonymousUser()
    request.GET = {}
    
    print("Testing audit_transactions view...")
    
    # Try to call the view directly
    from rest_framework.request import Request
    from rest_framework.test import APIRequestFactory
    
    # Create an API request
    factory = APIRequestFactory()
    request = factory.get('/api/v1/audit/transactions/')
    
    # Test with a real user if available
    users = User.objects.all()
    if users.exists():
        request.user = users.first()
        print(f"Using user: {request.user}")
    else:
        print("No users found, creating test user...")
        user = User.objects.create_user(
            username='testuser',
            password='testpass',
            role='AUDITOR'
        )
        request.user = user
    
    # Mock the request.GET
    request.GET = {}
    
    try:
        response = audit_transactions(request)
        print(f"View response status: {response.status_code}")
        print(f"View response data keys: {list(response.data.keys()) if hasattr(response, 'data') else 'No data'}")
    except Exception as view_error:
        print(f"View error: {view_error}")
        import traceback
        traceback.print_exc()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("Test completed.")
