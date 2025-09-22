#!/usr/bin/env python
"""
Quick test of SystemAlert data
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import SystemAlert

def test_alerts():
    """Test alerts in the database"""
    print("🔍 Testing System Alerts Database...")
    
    total = SystemAlert.objects.count()
    print(f"📊 Total alerts: {total}")
    
    if total > 0:
        print("\n📋 Alert Summary:")
        
        # By status
        statuses = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']
        for status in statuses:
            count = SystemAlert.objects.filter(status=status).count()
            print(f"  • {status}: {count}")
        
        print("\n🔢 By Type:")
        for alert_type, _ in SystemAlert.ALERT_TYPES:
            count = SystemAlert.objects.filter(alert_type=alert_type).count()
            print(f"  • {alert_type}: {count}")
        
        print("\n📈 By Priority:")
        for priority, label in SystemAlert.PRIORITY_CHOICES:
            count = SystemAlert.objects.filter(priority=priority).count()
            print(f"  • {label} ({priority}): {count}")
        
        print("\n📝 Recent Alerts:")
        recent = SystemAlert.objects.order_by('-created')[:3]
        for alert in recent:
            print(f"  • {alert.title} [{alert.alert_type}] - {alert.status}")
    
    else:
        print("❌ No alerts found in database!")

if __name__ == '__main__':
    test_alerts()