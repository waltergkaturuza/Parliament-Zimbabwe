# fuel/alerts.py
"""
System Alert Creation Utilities
Provides functions to create alerts based on system events
"""
from django.utils import timezone
from django.contrib.auth import get_user_model
from fuel.models import SystemAlert
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class AlertCreator:
    """Utility class for creating system alerts"""
    
    @staticmethod
    def create_alert(title, message, alert_type='INFO', priority=2, target_roles=None, 
                    expires_in_days=None, is_dismissible=True, created_by=None):
        """
        Create a system alert with the given parameters
        
        Args:
            title (str): Alert title
            message (str): Alert message
            alert_type (str): One of INFO, WARNING, ERROR, CRITICAL, SECURITY
            priority (int): 1-4 (Low to Critical)
            target_roles (list): List of roles this alert targets
            expires_in_days (int): Number of days until alert expires
            is_dismissible (bool): Whether users can dismiss this alert
            created_by (User): User who created the alert
        
        Returns:
            SystemAlert: Created alert instance
        """
        try:
            expires_at = None
            if expires_in_days:
                expires_at = timezone.now() + timezone.timedelta(days=expires_in_days)
            
            alert = SystemAlert.objects.create(
                title=title,
                message=message,
                alert_type=alert_type,
                priority=priority,
                target_roles=target_roles,
                expires_at=expires_at,
                is_dismissible=is_dismissible,
                created_by=created_by
            )
            
            logger.info(f"Created system alert: {title}")
            return alert
            
        except Exception as e:
            logger.error(f"Failed to create alert '{title}': {str(e)}")
            return None
    
    @staticmethod
    def create_low_stock_alert(item_name, current_stock, threshold, location=None, created_by=None):
        """Create an alert for low stock situations"""
        location_text = f" at {location}" if location else ""
        title = f"Low Stock Alert: {item_name}"
        message = f"{item_name} stock is running low{location_text}. Current stock: {current_stock} (threshold: {threshold}). Immediate restocking required."
        
        return AlertCreator.create_alert(
            title=title,
            message=message,
            alert_type='WARNING',
            priority=3,  # High priority
            is_dismissible=True,
            created_by=created_by
        )
    
    @staticmethod
    def create_transaction_failed_alert(transaction_id, reason, created_by=None):
        """Create an alert for failed transactions"""
        title = f"Transaction Failed: {transaction_id}"
        message = f"Transaction {transaction_id} failed. Reason: {reason}. Manual intervention may be required."
        
        return AlertCreator.create_alert(
            title=title,
            message=message,
            alert_type='ERROR',
            priority=3,  # High priority
            is_dismissible=True,
            created_by=created_by
        )
    
    @staticmethod
    def create_security_alert(event_description, ip_address=None, user=None, created_by=None):
        """Create a security-related alert"""
        ip_text = f" from IP {ip_address}" if ip_address else ""
        user_text = f" for user {user}" if user else ""
        title = "Security Alert"
        message = f"Security event detected: {event_description}{ip_text}{user_text}. Please investigate immediately."
        
        return AlertCreator.create_alert(
            title=title,
            message=message,
            alert_type='CRITICAL',
            priority=4,  # Critical priority
            target_roles=['SUPERUSER', 'ADMIN'],
            is_dismissible=False,
            created_by=created_by
        )
    
    @staticmethod
    def create_maintenance_alert(maintenance_description, start_time, end_time, created_by=None):
        """Create a maintenance notification alert"""
        title = "Scheduled Maintenance"
        message = f"Scheduled maintenance: {maintenance_description}. Maintenance window: {start_time} to {end_time}. Users may experience service interruptions."
        
        return AlertCreator.create_alert(
            title=title,
            message=message,
            alert_type='INFO',
            priority=2,  # Medium priority
            expires_in_days=1,  # Expires in 1 day
            is_dismissible=True,
            created_by=created_by
        )
    
    @staticmethod
    def create_system_error_alert(error_description, component=None, severity='WARNING', created_by=None):
        """Create a system error alert"""
        component_text = f" in {component}" if component else ""
        title = f"System Error{component_text}"
        message = f"System error detected: {error_description}. Please check system logs for more details."
        
        priority_map = {
            'INFO': 1,
            'WARNING': 2,
            'ERROR': 3,
            'CRITICAL': 4
        }
        
        return AlertCreator.create_alert(
            title=title,
            message=message,
            alert_type=severity,
            priority=priority_map.get(severity, 2),
            is_dismissible=True,
            created_by=created_by
        )

# Convenience functions for common alert types
def create_low_fuel_alert(current_books, threshold=100, location="Main Distribution Center"):
    """Create a low fuel coupon stock alert"""
    return AlertCreator.create_low_stock_alert(
        item_name="Fuel Coupon Books",
        current_stock=current_books,
        threshold=threshold,
        location=location
    )

def create_failed_login_alert(username, ip_address, attempt_count=3):
    """Create alert for failed login attempts"""
    return AlertCreator.create_security_alert(
        event_description=f"Multiple failed login attempts ({attempt_count}) detected",
        ip_address=ip_address,
        user=username
    )

def create_database_error_alert(error_message):
    """Create alert for database errors"""
    return AlertCreator.create_system_error_alert(
        error_description=error_message,
        component="Database",
        severity='ERROR'
    )

def create_backup_success_alert(backup_size="Unknown", created_by=None):
    """Create alert for successful backup completion"""
    return AlertCreator.create_alert(
        title="Backup Process Completed",
        message=f"Daily backup process completed successfully. Backup size: {backup_size}.",
        alert_type='INFO',
        priority=1,  # Low priority
        is_dismissible=True,
        created_by=created_by
    )