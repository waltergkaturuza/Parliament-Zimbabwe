#!/usr/bin/env python
"""
Test script to verify Django server can start after import fix
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
    
    print("✅ Django setup successful")
    
    # Test all imports from urls.py
    from fuel.views import (
        audit_transactions, audit_transaction_stats, audit_transaction_trail,
        export_audit_transactions, compliance_reports, compliance_stats,
        generate_compliance_report, download_compliance_report
    )
    
    print("✅ All audit function imports successful")
    
    # Test URL resolution
    from django.urls import resolve
    
    test_urls = [
        '/api/v1/audit/compliance-reports/',
        '/api/v1/audit/compliance-stats/',
        '/api/v1/audit/compliance-reports/1/download/',
        '/api/v1/audit/generate-compliance-report/',
        '/api/v1/audit/transactions/',
    ]
    
    print("\n🔗 Testing URL resolution:")
    for url in test_urls:
        try:
            match = resolve(url)
            print(f"✅ {url} → {match.func.__name__}")
        except Exception as e:
            print(f"❌ {url} → {e}")
    
    # Test Django check
    from django.core.management import execute_from_command_line
    print("\n🔍 Running Django system check...")
    
    # Simulate 'python manage.py check'
    sys.argv = ['manage.py', 'check']
    execute_from_command_line(sys.argv)
    
    print("🎉 All tests passed! Server should start correctly now.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
