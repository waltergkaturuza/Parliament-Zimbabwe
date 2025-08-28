#!/usr/bin/env python
"""
Script to create test audit logs for debugging the audit logs page
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(__file__))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from fuel.models import AuditLog, Box, Coupon

User = get_user_model()

def create_test_audit_logs():
    """Create sample audit logs for testing"""
    print("Creating test audit logs...")
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'ADMIN'
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        print(f"Created test user: {user.username}")
    
    # Get content types
    box_content_type = ContentType.objects.get_for_model(Box)
    coupon_content_type = ContentType.objects.get_for_model(Coupon)
    user_content_type = ContentType.objects.get_for_model(User)
    
    # Create various audit log entries
    audit_logs = [
        {
            'content_type': user_content_type,
            'object_id': str(user.pk),
            'object_repr': str(user),
            'action': 'LOGIN',
            'description': 'User logged into the system',
            'user': user,
            'user_ip': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'changes': {}
        },
        {
            'content_type': box_content_type,
            'object_id': '1',
            'object_repr': 'Box #1',
            'action': 'CREATE',
            'description': 'New box created',
            'user': user,
            'user_ip': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'changes': {'status': 'PENDING', 'created': True}
        },
        {
            'content_type': box_content_type,
            'object_id': '1',
            'object_repr': 'Box #1',
            'action': 'DISPATCH',
            'description': 'Box dispatched to fuel station',
            'user': user,
            'user_ip': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'changes': {'status': 'DISPATCHED', 'previous_status': 'PENDING'}
        },
        {
            'content_type': box_content_type,
            'object_id': '1',
            'object_repr': 'Box #1',
            'action': 'RECEIVE',
            'description': 'Box received at fuel station',
            'user': user,
            'user_ip': '192.168.1.101',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'changes': {'status': 'RECEIVED', 'previous_status': 'DISPATCHED'}
        },
        {
            'content_type': coupon_content_type,
            'object_id': '1',
            'object_repr': 'Coupon ABC123',
            'action': 'USE',
            'description': 'Coupon used for fuel purchase',
            'user': user,
            'user_ip': '192.168.1.102',
            'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            'changes': {'status': 'USED', 'amount': 50.0}
        },
        {
            'content_type': user_content_type,
            'object_id': str(user.pk),
            'object_repr': str(user),
            'action': 'UPDATE',
            'description': 'User profile updated',
            'user': user,
            'user_ip': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'changes': {'email': 'newemail@example.com', 'previous_email': 'test@example.com'}
        },
        {
            'content_type': user_content_type,
            'object_id': str(user.pk),
            'object_repr': str(user),
            'action': 'LOGOUT',
            'description': 'User logged out of the system',
            'user': user,
            'user_ip': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'changes': {}
        }
    ]
    
    # Create audit logs with different timestamps
    base_time = datetime.now() - timedelta(days=7)
    
    for i, log_data in enumerate(audit_logs):
        # Spread the logs over the past week
        timestamp = base_time + timedelta(days=i, hours=i*2)
        
        audit_log = AuditLog.objects.create(**log_data)
        # Update the created_at timestamp
        audit_log.created_at = timestamp
        audit_log.save()
        
        print(f"Created audit log: {audit_log.action} - {audit_log.description}")
    
    print(f"\nCreated {len(audit_logs)} test audit logs")
    
    # Count total audit logs
    total_count = AuditLog.objects.count()
    print(f"Total audit logs in database: {total_count}")

if __name__ == '__main__':
    create_test_audit_logs()
