#!/usr/bin/env python
"""
Test script to verify Django URL patterns for audit endpoints
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
    
    from django.urls import resolve, reverse, NoReverseMatch
    from django.core.exceptions import Resolver404
    
    # Test URLs that should work
    test_urls = [
        '/api/v1/audit/compliance-reports/',
        '/api/v1/audit/compliance-reports/test-123/download/',
        '/api/v1/audit/compliance-reports/1/download/',
        '/api/v1/audit/generate-compliance-report/',
        '/api/v1/audit/transactions/',
        '/api/v1/audit/transaction-stats/',
    ]
    
    print("Testing URL resolution:")
    print("=" * 50)
    
    for url in test_urls:
        try:
            match = resolve(url)
            print(f"✅ {url}")
            print(f"   → Function: {match.func.__name__}")
            print(f"   → View: {match.view_name}")
            if match.kwargs:
                print(f"   → Kwargs: {match.kwargs}")
            print()
        except Resolver404 as e:
            print(f"❌ {url}")
            print(f"   → Error: {e}")
            print()
    
    # Test reverse URL generation
    print("Testing reverse URL generation:")
    print("=" * 50)
    
    test_reverse = [
        ('compliance-reports', {}),
        ('download-compliance-report', {'report_id': 'test-123'}),
        ('generate-compliance-report', {}),
        ('audit-transactions', {}),
    ]
    
    for name, kwargs in test_reverse:
        try:
            url = reverse(name, kwargs=kwargs)
            print(f"✅ {name} → {url}")
        except NoReverseMatch as e:
            print(f"❌ {name} → Error: {e}")
    
    print()
    print("Testing function imports:")
    print("=" * 50)
    
    try:
        from fuel.views import (
            download_compliance_report, compliance_reports, 
            generate_compliance_report, audit_transactions
        )
        print("✅ All view functions imported successfully")
        
        # Test if functions are callable
        functions = [
            ('download_compliance_report', download_compliance_report),
            ('compliance_reports', compliance_reports),
            ('generate_compliance_report', generate_compliance_report),
            ('audit_transactions', audit_transactions),
        ]
        
        for name, func in functions:
            if callable(func):
                print(f"✅ {name} is callable")
            else:
                print(f"❌ {name} is not callable")
                
    except ImportError as e:
        print(f"❌ Import error: {e}")
    
except Exception as e:
    print(f"❌ Setup error: {e}")
    import traceback
    traceback.print_exc()
