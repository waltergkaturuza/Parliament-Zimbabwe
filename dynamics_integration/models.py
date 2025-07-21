"""
Microsoft Dynamics 365 Business Central Integration Models
Handles mapping and tracking of data synchronization between the fuel coupon system and Business Central
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class DynamicsMapping(models.Model):
    """Maps local system IDs to Business Central IDs for synchronization tracking"""
    
    ENTITY_TYPES = [
        ('ITEM', 'Item'),
        ('CUSTOMER', 'Customer'),
        ('VENDOR', 'Vendor'),
        ('EMPLOYEE', 'Employee'),
        ('JOURNAL', 'Journal Entry'),
        ('INVOICE', 'Invoice'),
        ('PAYMENT', 'Payment'),
        ('ASSET', 'Fixed Asset'),
    ]
    
    local_model = models.CharField(max_length=100, help_text="Django model name")
    local_id = models.CharField(max_length=50, help_text="Local system primary key")
    bc_entity = models.CharField(max_length=100, choices=ENTITY_TYPES, help_text="Business Central entity type")
    bc_id = models.CharField(max_length=50, help_text="Business Central entity ID")
    bc_number = models.CharField(max_length=50, blank=True, help_text="Business Central entity number/code")
    
    created = models.DateTimeField(auto_now_add=True)
    last_synced = models.DateTimeField(auto_now=True)
    
    # Sync status
    is_active = models.BooleanField(default=True)
    sync_errors = models.TextField(blank=True, help_text="Last sync error messages")
    
    class Meta:
        unique_together = ['local_model', 'local_id']
        indexes = [
            models.Index(fields=['local_model', 'local_id']),
            models.Index(fields=['bc_entity', 'bc_id']),
        ]
        verbose_name = "Dynamics Mapping"
        verbose_name_plural = "Dynamics Mappings"
    
    def __str__(self):
        return f"{self.local_model}({self.local_id}) → BC {self.bc_entity}({self.bc_id})"


class SyncLog(models.Model):
    """Track synchronization attempts and results for monitoring and debugging"""
    
    SYNC_TYPES = [
        ('TRANSACTION', 'Fuel Transaction'),
        ('INVENTORY', 'Coupon Inventory'),
        ('EMPLOYEE', 'Employee Data'),
        ('VEHICLE', 'Vehicle Asset'),
        ('FINANCIAL', 'Financial Entry'),
        ('BULK', 'Bulk Operation'),
    ]
    
    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partial Success'),
        ('RETRY', 'Retry Required'),
    ]
    
    sync_type = models.CharField(max_length=50, choices=SYNC_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    message = models.TextField(blank=True, help_text="Sync result message or error details")
    
    # Metrics
    records_processed = models.IntegerField(default=0)
    records_successful = models.IntegerField(default=0)
    records_failed = models.IntegerField(default=0)
    
    # Timing
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    
    # Context
    initiated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    batch_id = models.CharField(max_length=100, blank=True, help_text="Batch identifier for grouped operations")
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['sync_type', 'status']),
            models.Index(fields=['started_at']),
            models.Index(fields=['batch_id']),
        ]
        verbose_name = "Sync Log"
        verbose_name_plural = "Sync Logs"
    
    def __str__(self):
        return f"{self.sync_type} - {self.status} ({self.started_at.strftime('%Y-%m-%d %H:%M')})"
    
    def mark_completed(self, status='SUCCESS', message=''):
        """Mark the sync operation as completed"""
        self.completed_at = timezone.now()
        self.status = status
        if message:
            self.message = message
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.duration_seconds = delta.total_seconds()
        self.save()


class SyncQueue(models.Model):
    """Queue for failed sync attempts that need retry"""
    
    PRIORITY_CHOICES = [
        (1, 'Low'),
        (2, 'Normal'),
        (3, 'High'),
        (4, 'Critical'),
    ]
    
    model_name = models.CharField(max_length=100, help_text="Model that failed to sync")
    object_id = models.CharField(max_length=50, help_text="Primary key of the object")
    sync_type = models.CharField(max_length=50, help_text="Type of sync operation")
    
    # Retry management
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    next_retry = models.DateTimeField(default=timezone.now)
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=2)
    
    # Error tracking
    last_error = models.TextField(blank=True)
    last_attempt = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_processing = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['priority', 'next_retry']
        indexes = [
            models.Index(fields=['is_active', 'next_retry']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['priority']),
        ]
        verbose_name = "Sync Queue Item"
        verbose_name_plural = "Sync Queue"
    
    def __str__(self):
        return f"{self.model_name}({self.object_id}) - Retry {self.retry_count}/{self.max_retries}"
    
    def can_retry(self):
        """Check if this item can be retried"""
        return (self.is_active and 
                self.retry_count < self.max_retries and 
                timezone.now() >= self.next_retry)
    
    def increment_retry(self, error_message=''):
        """Increment retry count and schedule next attempt"""
        self.retry_count += 1
        self.last_error = error_message
        
        # Exponential backoff: 1min, 5min, 30min, 2hr, etc.
        backoff_minutes = [1, 5, 30, 120, 480][min(self.retry_count - 1, 4)]
        self.next_retry = timezone.now() + timezone.timedelta(minutes=backoff_minutes)
        
        if self.retry_count >= self.max_retries:
            self.is_active = False
        
        self.save()


class BusinessCentralConfig(models.Model):
    """Configuration settings for Business Central integration"""
    
    ENVIRONMENT_TYPES = [
        ('SANDBOX', 'Sandbox'),
        ('PRODUCTION', 'Production'),
    ]
    
    name = models.CharField(max_length=100, unique=True, help_text="Configuration name")
    description = models.TextField(blank=True)
    
    # Connection settings
    tenant_id = models.CharField(max_length=100, help_text="Azure AD Tenant ID")
    environment_name = models.CharField(max_length=100, help_text="Business Central environment name")
    environment_type = models.CharField(max_length=20, choices=ENVIRONMENT_TYPES, default='SANDBOX')
    
    # API settings
    base_url = models.URLField(help_text="Business Central API base URL")
    client_id = models.CharField(max_length=100, help_text="Azure AD App Client ID")
    company_id = models.CharField(max_length=100, blank=True, help_text="Business Central Company ID")
    
    # Sync preferences
    auto_sync_enabled = models.BooleanField(default=True)
    batch_size = models.IntegerField(default=100, help_text="Records per batch sync")
    sync_interval_minutes = models.IntegerField(default=15, help_text="Auto sync interval")
    
    # Account mappings
    fuel_expense_account = models.CharField(max_length=20, default='6100', help_text="GL Account for fuel expenses")
    coupon_inventory_account = models.CharField(max_length=20, default='1400', help_text="GL Account for coupon inventory")
    cash_account = models.CharField(max_length=20, default='1000', help_text="GL Account for cash/bank")
    
    # Status
    is_active = models.BooleanField(default=True)
    last_connection_test = models.DateTimeField(null=True, blank=True)
    connection_status = models.CharField(max_length=20, default='UNKNOWN')
    
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Business Central Configuration"
        verbose_name_plural = "Business Central Configurations"
    
    def __str__(self):
        return f"{self.name} ({self.environment_type})"


class SyncRule(models.Model):
    """Define synchronization rules and field mappings"""
    
    TRIGGER_TYPES = [
        ('REALTIME', 'Real-time (on save)'),
        ('SCHEDULED', 'Scheduled batch'),
        ('MANUAL', 'Manual only'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Source configuration
    source_model = models.CharField(max_length=100, help_text="Django model to sync from")
    source_filters = models.JSONField(default=dict, blank=True, help_text="Filter criteria for source records")
    
    # Destination configuration
    bc_entity = models.CharField(max_length=100, help_text="Business Central entity type")
    bc_endpoint = models.CharField(max_length=200, help_text="API endpoint path")
    
    # Sync behavior
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_TYPES, default='REALTIME')
    field_mappings = models.JSONField(default=dict, help_text="Field mapping configuration")
    transformation_rules = models.JSONField(default=dict, blank=True, help_text="Data transformation rules")
    
    # Status
    is_active = models.BooleanField(default=True)
    last_executed = models.DateTimeField(null=True, blank=True)
    execution_count = models.IntegerField(default=0)
    
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Sync Rule"
        verbose_name_plural = "Sync Rules"
    
    def __str__(self):
        return f"{self.name} ({self.source_model} → {self.bc_entity})"
