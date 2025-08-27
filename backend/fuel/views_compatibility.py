"""
Backwards compatibility fix for SystemAlert API
This handles the case where production database doesn't have the new fields yet
"""

from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def check_systemalert_fields():
    """Check if SystemAlert table has the new fields"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("PRAGMA table_info(fuel_systemalert);")
            columns = {row[1] for row in cursor.fetchall()}
            
            required_fields = {'priority', 'target_roles', 'expires_at', 'is_dismissible'}
            missing_fields = required_fields - columns
            
            return len(missing_fields) == 0, missing_fields
    except Exception as e:
        logger.error(f"Error checking SystemAlert fields: {e}")
        return False, set()

@api_view(['GET'])
def systemalert_compatibility_check(request):
    """Check if SystemAlert API is compatible with current database"""
    has_fields, missing = check_systemalert_fields()
    
    if has_fields:
        return JsonResponse({
            'compatible': True,
            'message': 'SystemAlert API is fully compatible'
        })
    else:
        return JsonResponse({
            'compatible': False,
            'message': 'Database migration required',
            'missing_fields': list(missing),
            'action_required': 'Run migrations on production database'
        }, status=503)

@api_view(['GET']) 
def simple_systemalert_list(request):
    """Simple SystemAlert list that works with old database schema"""
    from fuel.models import SystemAlert
    
    try:
        # Get basic fields that should exist in old schema
        alerts = SystemAlert.objects.all().values(
            'id', 'title', 'message', 'alert_type', 'status', 
            'created', 'modified'
        ).order_by('-created')[:50]  # Limit to 50 recent alerts
        
        # Add default values for missing fields
        for alert in alerts:
            alert['priority'] = 2  # Medium priority default
            alert['target_roles'] = None
            alert['expires_at'] = None
            alert['is_dismissible'] = True
        
        return JsonResponse({
            'count': len(alerts),
            'results': list(alerts)
        })
        
    except Exception as e:
        logger.error(f"Error in simple_systemalert_list: {e}")
        return JsonResponse({
            'error': 'Database schema incompatible',
            'message': str(e),
            'action_required': 'Apply database migrations'
        }, status=500)

@api_view(['GET'])
def simple_systemalert_stats(request):
    """Simple stats that work with old database schema"""
    from fuel.models import SystemAlert
    
    try:
        total = SystemAlert.objects.count()
        active = SystemAlert.objects.filter(status='ACTIVE').count()
        resolved = SystemAlert.objects.filter(status='RESOLVED').count()
        
        return JsonResponse({
            'total_alerts': total,
            'active_alerts': active,
            'resolved_alerts': resolved,
            'acknowledged_alerts': 0,  # Default for compatibility
            'dismissed_alerts': 0,     # Default for compatibility
            'expired_alerts': 0,       # Default for compatibility
            'alerts_by_type': {
                'INFO': SystemAlert.objects.filter(alert_type='INFO').count(),
                'WARNING': SystemAlert.objects.filter(alert_type='WARNING').count(),
                'ERROR': SystemAlert.objects.filter(alert_type='ERROR').count(),
                'CRITICAL': SystemAlert.objects.filter(alert_type='CRITICAL').count(),
            },
            'database_compatible': False,
            'migration_required': True
        })
        
    except Exception as e:
        logger.error(f"Error in simple_systemalert_stats: {e}")
        return JsonResponse({
            'error': 'Database error',
            'message': str(e)
        }, status=500)
