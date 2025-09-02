#!/usr/bin/env python3
"""
Debug script for home activity API issue
Run this in production to diagnose the 500 error
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from fuel.models import SystemAlert, SubCenter, ParliamentSession

def debug_activity_endpoint():
    print("🔍 Debugging /api/v1/home/activity/ endpoint")
    print("=" * 50)
    
    try:
        print("✅ Django setup successful")
        print(f"✅ Current time: {timezone.now()}")
        
        # Test SystemAlert model
        try:
            alert_count = SystemAlert.objects.count()
            recent_alerts = SystemAlert.objects.filter(
                created__gte=timezone.now() - timedelta(days=7)
            ).count()
            print(f"✅ SystemAlert: {alert_count} total, {recent_alerts} recent")
        except Exception as e:
            print(f"❌ SystemAlert error: {e}")
        
        # Test SubCenter model
        try:
            center_count = SubCenter.objects.count()
            recent_centers = SubCenter.objects.filter(
                created__gte=timezone.now() - timedelta(days=7)
            ).count()
            print(f"✅ SubCenter: {center_count} total, {recent_centers} recent")
        except Exception as e:
            print(f"❌ SubCenter error: {e}")
        
        # Test ParliamentSession model
        try:
            session_count = ParliamentSession.objects.count()
            recent_sessions = ParliamentSession.objects.filter(
                start_date__gte=timezone.now() - timedelta(days=7)
            ).count()
            print(f"✅ ParliamentSession: {session_count} total, {recent_sessions} recent")
        except Exception as e:
            print(f"❌ ParliamentSession error: {e}")
        
        # Test the actual view logic
        try:
            from fuel.views_home import recent_activity
            from django.test import RequestFactory
            
            factory = RequestFactory()
            request = factory.get('/api/v1/home/activity/')
            
            response = recent_activity(request)
            print(f"✅ View function response status: {response.status_code}")
            print(f"✅ Response data: {response.data}")
            
        except Exception as e:
            print(f"❌ View function error: {e}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"❌ Setup error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_activity_endpoint()
