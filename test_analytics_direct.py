#!/usr/bin/env python
"""
Django test for analytics endpoint
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

# Setup Django
django.setup()

from django.test import RequestFactory
from fuel.views_main import analytics_dispatches_timeline
from fuel.models import BookDispatch, Program, ParliamentSession
import json

def test_analytics():
    print("🚀 Testing Analytics Dispatches Timeline Function")
    print("=" * 60)
    
    # Create a mock request
    factory = RequestFactory()
    
    # Test 1: Basic request
    print("\n1. Testing basic request...")
    request = factory.get('/api/v1/analytics/dispatches-timeline/')
    
    try:
        response = analytics_dispatches_timeline(request)
        data = json.loads(response.content)
        
        print(f"   ✅ Success! Status: {response.status_code}")
        print(f"   Timeline entries: {len(data.get('timeline', []))}")
        print(f"   Has by_program field: {'by_program' in data}")
        print(f"   Has by_session field: {'by_session' in data}")
        
        if 'by_program' in data:
            print(f"   by_program entries: {len(data['by_program'])}")
        
        if 'by_session' in data:
            print(f"   by_session entries: {len(data['by_session'])}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Request with program_id filter
    print("\n2. Testing request with program_id filter...")
    request = factory.get('/api/v1/analytics/dispatches-timeline/?program_id=1')
    
    try:
        response = analytics_dispatches_timeline(request)
        data = json.loads(response.content)
        
        print(f"   ✅ Success! Status: {response.status_code}")
        print(f"   Timeline entries: {len(data.get('timeline', []))}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Request with session_id filter
    print("\n3. Testing request with session_id filter...")
    request = factory.get('/api/v1/analytics/dispatches-timeline/?session_id=1')
    
    try:
        response = analytics_dispatches_timeline(request)
        data = json.loads(response.content)
        
        print(f"   ✅ Success! Status: {response.status_code}")
        print(f"   Timeline entries: {len(data.get('timeline', []))}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Show database counts
    print("\n" + "=" * 60)
    print("📊 Database Status:")
    print(f"   BookDispatch records: {BookDispatch.objects.count()}")
    print(f"   Program records: {Program.objects.count()}")
    print(f"   ParliamentSession records: {ParliamentSession.objects.count()}")
    
    print("\n🎯 Analytics function testing complete!")

if __name__ == "__main__":
    test_analytics()
