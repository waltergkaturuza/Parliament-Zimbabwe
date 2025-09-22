#!/usr/bin/env python
"""
Create sample system alerts for testing the alerts management system
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import SystemAlert, User
from django.utils import timezone

def create_sample_alerts():
    """Create sample alerts for testing"""
    
    # Get a user to assign as creator (use superuser if available)
    try:
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.first()
    except Exception:
        admin_user = None
    
    sample_alerts = [
        {
            'title': 'Low Fuel Coupon Stock Alert',
            'message': 'Fuel coupon stock is running low at Main Distribution Center. Current stock: 150 books remaining. Immediate restocking required.',
            'alert_type': 'WARNING',
            'status': 'ACTIVE',
            'priority': 3,  # High
            'is_dismissible': True,
        },
        {
            'title': 'System Maintenance Scheduled',
            'message': 'Scheduled system maintenance will occur on September 25, 2025, from 2:00 AM to 4:00 AM. Users may experience service interruptions.',
            'alert_type': 'INFO',
            'status': 'ACTIVE',
            'priority': 2,  # Medium
            'expires_at': timezone.now() + timedelta(days=3),
            'is_dismissible': True,
        },
        {
            'title': 'Failed Distribution Transaction',
            'message': 'Distribution transaction #TXN-2025-0922-001 failed due to insufficient coupon stock. Manual intervention required.',
            'alert_type': 'ERROR',
            'status': 'ACTIVE',
            'priority': 3,  # High
            'is_dismissible': True,
        },
        {
            'title': 'Critical Security Alert',
            'message': 'Multiple failed login attempts detected from IP address 192.168.1.100. Account lockout initiated for user admin@parliament.zw.',
            'alert_type': 'CRITICAL',
            'status': 'ACTIVE',
            'priority': 4,  # Critical
            'is_dismissible': False,
        },
        {
            'title': 'Database Connection Issue',
            'message': 'Intermittent database connection timeouts detected. System performance may be affected. Investigation in progress.',
            'alert_type': 'WARNING',
            'status': 'ACKNOWLEDGED',
            'priority': 3,  # High
            'acknowledged_at': timezone.now() - timedelta(hours=2),
            'is_dismissible': True,
        },
        {
            'title': 'Backup Process Completed',
            'message': 'Daily backup process completed successfully. 2.5GB of data backed up to secure storage.',
            'alert_type': 'INFO',
            'status': 'RESOLVED',
            'priority': 1,  # Low
            'is_dismissible': True,
        },
        {
            'title': 'Vehicle Registration Update',
            'message': 'New vehicle registration system has been deployed. All users should verify their vehicle information.',
            'alert_type': 'INFO',
            'status': 'ACTIVE',
            'priority': 2,  # Medium
            'expires_at': timezone.now() + timedelta(days=7),
            'is_dismissible': True,
        },
        {
            'title': 'API Rate Limit Exceeded',
            'message': 'API rate limit exceeded for client application. Service throttling is in effect.',
            'alert_type': 'WARNING',
            'status': 'DISMISSED',
            'priority': 2,  # Medium
            'is_dismissible': True,
        }
    ]
    
    created_alerts = []
    
    for alert_data in sample_alerts:
        try:
            # Add creator if available
            if admin_user:
                alert_data['created_by'] = admin_user
                
            # Set acknowledged_by for acknowledged alerts
            if alert_data['status'] == 'ACKNOWLEDGED' and admin_user:
                alert_data['acknowledged_by'] = admin_user
            
            alert = SystemAlert.objects.create(**alert_data)
            created_alerts.append(alert)
            print(f"✅ Created alert: {alert.title}")
            
        except Exception as e:
            print(f"❌ Error creating alert '{alert_data['title']}': {str(e)}")
    
    print(f"\n🎉 Successfully created {len(created_alerts)} sample alerts!")
    print("\nAlert Summary:")
    print(f"  • Total: {SystemAlert.objects.count()}")
    print(f"  • Active: {SystemAlert.objects.filter(status='ACTIVE').count()}")
    print(f"  • Acknowledged: {SystemAlert.objects.filter(status='ACKNOWLEDGED').count()}")
    print(f"  • Resolved: {SystemAlert.objects.filter(status='RESOLVED').count()}")
    print(f"  • Dismissed: {SystemAlert.objects.filter(status='DISMISSED').count()}")
    
    # Print stats by type
    print(f"\nBy Type:")
    for alert_type, _ in SystemAlert.ALERT_TYPES:
        count = SystemAlert.objects.filter(alert_type=alert_type).count()
        print(f"  • {alert_type}: {count}")
    
    # Print stats by priority
    print(f"\nBy Priority:")
    for priority, label in SystemAlert.PRIORITY_CHOICES:
        count = SystemAlert.objects.filter(priority=priority).count()
        print(f"  • {label} ({priority}): {count}")

if __name__ == '__main__':
    print("🚀 Creating sample system alerts...")
    create_sample_alerts()