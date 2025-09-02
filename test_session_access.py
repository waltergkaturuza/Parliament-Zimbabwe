#!/usr/bin/env python3
"""
Test the specific part of recent_activity that's failing
"""

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from fuel.models import ParliamentSession

def test_session_access():
    try:
        # Get recent sessions
        recent_sessions = ParliamentSession.objects.filter(
            start_date__gte=timezone.now() - timedelta(days=7)
        ).order_by('-start_date')[:2]
        
        print(f"Found {recent_sessions.count()} recent sessions")
        
        for session in recent_sessions:
            print(f"Session object: {session}")
            print(f"Session type: {type(session)}")
            print(f"Session title: {session.title}")
            print(f"Session session_type: {session.session_type}")
            
            # Try to access name attribute
            try:
                print(f"Session name: {session.name}")
            except AttributeError as e:
                print(f"AttributeError: {e}")
            
            # Test the description format
            description = f'{session.title} - {session.session_type}'
            print(f"Description: {description}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_session_access()
