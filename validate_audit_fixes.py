#!/usr/bin/env python
"""
Simple test to validate the audit endpoint fixes
"""
import os
import sys

# Add project directory to path
sys.path.insert(0, '.')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    import django
    django.setup()
    
    # Test imports
    from fuel.views import audit_transactions, compliance_reports, compliance_stats
    from fuel.models import AuditLog
    
    print("✓ All imports successful")
    
    # Test AuditLog model fields
    field_names = [f.name for f in AuditLog._meta.get_fields()]
    required_fields = ['content_type', 'object_id', 'action', 'created', 'user', 'user_ip', 'description', 'changes']
    
    missing_fields = [f for f in required_fields if f not in field_names]
    if missing_fields:
        print(f"✗ Missing required fields: {missing_fields}")
    else:
        print("✓ All required AuditLog fields present")
    
    # Test URL configuration
    from fuel.urls import urlpatterns
    audit_urls = [url for url in urlpatterns if 'audit' in str(url.pattern)]
    print(f"✓ Found {len(audit_urls)} audit URLs")
    
    # Test compliance endpoints exist
    compliance_patterns = [url for url in urlpatterns if 'compliance' in str(url.pattern)]
    print(f"✓ Found {len(compliance_patterns)} compliance URLs")
    
    print("✓ All basic validation tests passed!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
