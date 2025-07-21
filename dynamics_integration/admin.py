"""
Django Admin Configuration for Dynamics 365 Integration
Provides admin interface for managing BC integration settings, monitoring sync status, and troubleshooting
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse, path
from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from .models import (
    DynamicsMapping, SyncLog, SyncQueue, 
    BusinessCentralConfig, SyncRule
)
from .services import BusinessCentralAPI, SyncQueueProcessor


@admin.register(BusinessCentralConfig)
class BusinessCentralConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'environment_type', 'connection_status_display', 'auto_sync_enabled', 'last_connection_test', 'is_active')
    list_filter = ('environment_type', 'is_active', 'auto_sync_enabled', 'connection_status')
    search_fields = ('name', 'tenant_id', 'environment_name')
    readonly_fields = ('connection_status', 'last_connection_test', 'created', 'updated')
    
    fieldsets = (
        ('Basic Configuration', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Connection Settings', {
            'fields': ('tenant_id', 'environment_name', 'environment_type', 'base_url', 'client_id', 'company_id')
        }),
        ('Sync Preferences', {
            'fields': ('auto_sync_enabled', 'batch_size', 'sync_interval_minutes')
        }),
        ('Account Mappings', {
            'fields': ('fuel_expense_account', 'coupon_inventory_account', 'cash_account')
        }),
        ('Status', {
            'fields': ('connection_status', 'last_connection_test', 'created', 'updated'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['test_connection', 'enable_auto_sync', 'disable_auto_sync']
    
    def connection_status_display(self, obj):
        """Display connection status with color coding"""
        colors = {
            'CONNECTED': 'green',
            'FAILED': 'red',
            'UNKNOWN': 'orange'
        }
        color = colors.get(obj.connection_status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.connection_status
        )
    connection_status_display.short_description = 'Connection Status'
    
    def test_connection(self, request, queryset):
        """Test connection for selected configurations"""
        for config in queryset:
            try:
                api = BusinessCentralAPI(config.name)
                success = api.test_connection()
                
                if success:
                    messages.success(request, f"Connection test successful for {config.name}")
                else:
                    messages.error(request, f"Connection test failed for {config.name}")
                    
            except Exception as e:
                messages.error(request, f"Connection test error for {config.name}: {str(e)}")
    
    test_connection.short_description = "Test connection to Business Central"
    
    def enable_auto_sync(self, request, queryset):
        queryset.update(auto_sync_enabled=True)
        messages.success(request, f"Auto-sync enabled for {queryset.count()} configurations")
    
    enable_auto_sync.short_description = "Enable auto-sync"
    
    def disable_auto_sync(self, request, queryset):
        queryset.update(auto_sync_enabled=False)
        messages.warning(request, f"Auto-sync disabled for {queryset.count()} configurations")
    
    disable_auto_sync.short_description = "Disable auto-sync"


@admin.register(DynamicsMapping)
class DynamicsMappingAdmin(admin.ModelAdmin):
    list_display = ('local_model', 'local_id', 'bc_entity', 'bc_number', 'last_synced', 'is_active')
    list_filter = ('local_model', 'bc_entity', 'is_active', 'last_synced')
    search_fields = ('local_id', 'bc_id', 'bc_number')
    readonly_fields = ('created', 'last_synced')
    
    fieldsets = (
        ('Mapping Information', {
            'fields': ('local_model', 'local_id', 'bc_entity', 'bc_id', 'bc_number')
        }),
        ('Status', {
            'fields': ('is_active', 'sync_errors', 'created', 'last_synced')
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ('sync_type', 'status_display', 'records_processed', 'duration_display', 'started_at', 'initiated_by')
    list_filter = ('sync_type', 'status', 'started_at')
    search_fields = ('message', 'batch_id')
    readonly_fields = ('started_at', 'completed_at', 'duration_seconds')
    date_hierarchy = 'started_at'
    
    fieldsets = (
        ('Sync Information', {
            'fields': ('sync_type', 'status', 'message', 'batch_id')
        }),
        ('Metrics', {
            'fields': ('records_processed', 'records_successful', 'records_failed')
        }),
        ('Timing', {
            'fields': ('started_at', 'completed_at', 'duration_seconds')
        }),
        ('Context', {
            'fields': ('initiated_by',)
        })
    )
    
    def status_display(self, obj):
        """Display status with color coding"""
        colors = {
            'SUCCESS': 'green',
            'FAILED': 'red',
            'PENDING': 'orange',
            'PARTIAL': 'blue',
            'RETRY': 'purple'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.status
        )
    status_display.short_description = 'Status'
    
    def duration_display(self, obj):
        """Display duration in human-readable format"""
        if obj.duration_seconds is None:
            return '-'
        
        if obj.duration_seconds < 60:
            return f"{obj.duration_seconds:.1f}s"
        elif obj.duration_seconds < 3600:
            return f"{obj.duration_seconds/60:.1f}m"
        else:
            return f"{obj.duration_seconds/3600:.1f}h"
    
    duration_display.short_description = 'Duration'
    
    def has_add_permission(self, request):
        return False  # Sync logs are created programmatically


@admin.register(SyncQueue)
class SyncQueueAdmin(admin.ModelAdmin):
    list_display = ('model_name', 'object_id', 'sync_type', 'retry_count', 'priority_display', 'next_retry', 'is_active')
    list_filter = ('model_name', 'sync_type', 'priority', 'is_active', 'is_processing')
    search_fields = ('object_id', 'last_error')
    readonly_fields = ('created', 'last_attempt')
    
    fieldsets = (
        ('Queue Item', {
            'fields': ('model_name', 'object_id', 'sync_type', 'priority')
        }),
        ('Retry Management', {
            'fields': ('retry_count', 'max_retries', 'next_retry', 'last_error')
        }),
        ('Status', {
            'fields': ('is_active', 'is_processing', 'created', 'last_attempt')
        })
    )
    
    actions = ['retry_now', 'reset_retry_count', 'deactivate_items']
    
    def priority_display(self, obj):
        """Display priority with visual indicators"""
        priority_map = {1: '🔵 Low', 2: '🟡 Normal', 3: '🟠 High', 4: '🔴 Critical'}
        return priority_map.get(obj.priority, str(obj.priority))
    
    priority_display.short_description = 'Priority'
    
    def retry_now(self, request, queryset):
        """Force retry of selected queue items"""
        updated = queryset.filter(is_active=True).update(
            next_retry=timezone.now(),
            is_processing=False
        )
        messages.success(request, f"Scheduled {updated} items for immediate retry")
    
    retry_now.short_description = "Retry now"
    
    def reset_retry_count(self, request, queryset):
        """Reset retry count for selected items"""
        updated = queryset.update(
            retry_count=0,
            next_retry=timezone.now(),
            is_active=True
        )
        messages.success(request, f"Reset retry count for {updated} items")
    
    reset_retry_count.short_description = "Reset retry count"
    
    def deactivate_items(self, request, queryset):
        """Deactivate selected queue items"""
        updated = queryset.update(is_active=False)
        messages.warning(request, f"Deactivated {updated} queue items")
    
    deactivate_items.short_description = "Deactivate items"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('process-queue/', self.admin_site.admin_view(self.process_queue), name='process_sync_queue'),
        ]
        return custom_urls + urls
    
    def process_queue(self, request):
        """Process sync queue manually"""
        if request.method == 'POST':
            try:
                processor = SyncQueueProcessor()
                stats = processor.process_queue()
                
                messages.success(
                    request, 
                    f"Queue processing completed: {stats['successful']} successful, "
                    f"{stats['failed']} failed, {stats['skipped']} skipped"
                )
                
            except Exception as e:
                messages.error(request, f"Queue processing error: {str(e)}")
        
        return redirect('admin:dynamics_integration_syncqueue_changelist')


@admin.register(SyncRule)
class SyncRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'source_model', 'bc_entity', 'trigger_type', 'is_active', 'last_executed', 'execution_count')
    list_filter = ('trigger_type', 'is_active', 'source_model')
    search_fields = ('name', 'description', 'source_model', 'bc_entity')
    readonly_fields = ('last_executed', 'execution_count', 'created', 'updated')
    
    fieldsets = (
        ('Rule Definition', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Source Configuration', {
            'fields': ('source_model', 'source_filters')
        }),
        ('Destination Configuration', {
            'fields': ('bc_entity', 'bc_endpoint')
        }),
        ('Sync Behavior', {
            'fields': ('trigger_type', 'field_mappings', 'transformation_rules')
        }),
        ('Statistics', {
            'fields': ('last_executed', 'execution_count', 'created', 'updated'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['activate_rules', 'deactivate_rules']
    
    def activate_rules(self, request, queryset):
        updated = queryset.update(is_active=True)
        messages.success(request, f"Activated {updated} sync rules")
    
    activate_rules.short_description = "Activate selected rules"
    
    def deactivate_rules(self, request, queryset):
        updated = queryset.update(is_active=False)
        messages.warning(request, f"Deactivated {updated} sync rules")
    
    deactivate_rules.short_description = "Deactivate selected rules"


# Custom admin views for monitoring and management

class DynamicsIntegrationAdmin:
    """Custom admin site for Dynamics Integration monitoring"""
    
    def get_urls(self):
        from django.urls import path
        
        return [
            path('dashboard/', self.dashboard_view, name='dynamics_dashboard'),
            path('sync-status/', self.sync_status_view, name='dynamics_sync_status'),
            path('test-connection/<int:config_id>/', self.test_connection_view, name='dynamics_test_connection'),
        ]
    
    def dashboard_view(self, request):
        """Main dashboard for Dynamics integration"""
        context = {
            'recent_logs': SyncLog.objects.all()[:10],
            'queue_count': SyncQueue.objects.filter(is_active=True).count(),
            'failed_count': SyncQueue.objects.filter(is_active=True, retry_count__gte=3).count(),
            'configs': BusinessCentralConfig.objects.filter(is_active=True),
        }
        
        return render(request, 'admin/dynamics_integration/dashboard.html', context)
    
    def sync_status_view(self, request):
        """AJAX endpoint for sync status updates"""
        stats = {
            'queue_count': SyncQueue.objects.filter(is_active=True).count(),
            'processing_count': SyncQueue.objects.filter(is_processing=True).count(),
            'failed_count': SyncQueue.objects.filter(is_active=True, retry_count__gte=3).count(),
            'recent_success': SyncLog.objects.filter(status='SUCCESS').count(),
            'recent_failed': SyncLog.objects.filter(status='FAILED').count(),
        }
        
        return JsonResponse(stats)
    
    def test_connection_view(self, request, config_id):
        """Test connection for specific configuration"""
        try:
            config = BusinessCentralConfig.objects.get(id=config_id)
            api = BusinessCentralAPI(config.name)
            success = api.test_connection()
            
            return JsonResponse({
                'success': success,
                'status': config.connection_status,
                'last_test': config.last_connection_test.isoformat() if config.last_connection_test else None
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})


# Register the custom admin site
dynamics_admin = DynamicsIntegrationAdmin()
