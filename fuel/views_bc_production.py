# fuel/views_bc_production.py
"""
Business Central Production Integration Views
Handles BC webhooks, data sync, and iframe embedding for production
"""

from rest_framework.decorators import api_view, permission_classes, csrf_exempt
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required
from django.conf import settings
from datetime import datetime, timedelta
import json
import logging

from .models import (
    FuelTransaction, User, SubCenter, CouponDistribution,
    ParliamentSession, SystemAlert, AuditLog
)

logger = logging.getLogger(__name__)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def bc_webhook(request):
    """
    Webhook endpoint for Business Central to send data updates
    """
    try:
        data = json.loads(request.body)
        event_type = data.get('eventType')
        entity_data = data.get('entityData', {})
        
        logger.info(f"BC Webhook received: {event_type}")
        
        # Route to appropriate handler
        if event_type == 'transaction_created':
            return handle_bc_transaction_created(entity_data)
        elif event_type == 'transaction_updated':
            return handle_bc_transaction_updated(entity_data)
        elif event_type == 'sync_request':
            return handle_bc_sync_request(entity_data)
        else:
            logger.warning(f"Unknown BC event type: {event_type}")
            return JsonResponse({'status': 'error', 'message': 'Unknown event type'})
            
    except json.JSONDecodeError:
        logger.error("Invalid JSON in BC webhook")
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"BC Webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def handle_bc_transaction_created(entity_data):
    """Handle new transaction from Business Central"""
    try:
        # Create or update transaction record
        transaction, created = FuelTransaction.objects.get_or_create(
            bc_transaction_no=entity_data.get('bc_transaction_no'),
            defaults={
                'transaction_date': datetime.now().date(),
                'employee_no': entity_data.get('employee_no', ''),
                'fuel_amount': entity_data.get('amount', 0),
                'status': 'PENDING',
                'created_by_bc': True
            }
        )
        
        # Log the creation
        AuditLog.objects.create(
            action='CREATE',
            object_type='FuelTransaction',
            object_id=str(transaction.id),
            details=f"Transaction created from BC: {entity_data.get('bc_transaction_no')}",
            user=None  # BC system user
        )
        
        return JsonResponse({
            'status': 'success',
            'transaction_id': transaction.id,
            'created': created
        })
        
    except Exception as e:
        logger.error(f"Error handling BC transaction creation: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def handle_bc_transaction_updated(entity_data):
    """Handle transaction update from Business Central"""
    try:
        bc_transaction_no = entity_data.get('bc_transaction_no')
        
        if not bc_transaction_no:
            return JsonResponse({'status': 'error', 'message': 'Missing BC transaction number'})
        
        transaction = FuelTransaction.objects.filter(
            bc_transaction_no=bc_transaction_no
        ).first()
        
        if transaction:
            # Update transaction fields
            if 'status' in entity_data:
                transaction.status = entity_data['status']
            if 'amount' in entity_data:
                transaction.fuel_amount = entity_data['amount']
            
            transaction.save()
            
            # Log the update
            AuditLog.objects.create(
                action='UPDATE',
                object_type='FuelTransaction',
                object_id=str(transaction.id),
                details=f"Transaction updated from BC: {bc_transaction_no}",
                user=None
            )
            
            return JsonResponse({'status': 'success', 'updated': True})
        else:
            return JsonResponse({'status': 'error', 'message': 'Transaction not found'})
            
    except Exception as e:
        logger.error(f"Error handling BC transaction update: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def handle_bc_sync_request(entity_data):
    """Handle sync request from Business Central"""
    try:
        sync_type = entity_data.get('sync_type', 'incremental')
        
        if sync_type == 'full':
            # Full sync - return all recent transactions
            transactions = FuelTransaction.objects.filter(
                transaction_date__gte=datetime.now().date() - timedelta(days=30)
            )
        else:
            # Incremental sync - return transactions modified in last 24 hours
            transactions = FuelTransaction.objects.filter(
                updated_at__gte=datetime.now() - timedelta(hours=24)
            )
        
        # Build sync response
        sync_data = []
        for transaction in transactions:
            sync_data.append({
                'id': transaction.id,
                'bc_transaction_no': transaction.bc_transaction_no,
                'employee_no': transaction.employee_no,
                'fuel_amount': float(transaction.fuel_amount),
                'status': transaction.status,
                'transaction_date': transaction.transaction_date.isoformat(),
                'updated_at': transaction.updated_at.isoformat()
            })
        
        return JsonResponse({
            'status': 'success',
            'sync_type': sync_type,
            'count': len(sync_data),
            'transactions': sync_data
        })
        
    except Exception as e:
        logger.error(f"Error handling BC sync request: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def bc_dashboard_data(request):
    """
    API endpoint to provide dashboard data for BC iframe
    """
    try:
        # Get recent transactions
        recent_transactions = FuelTransaction.objects.filter(
            transaction_date__gte=datetime.now().date() - timedelta(days=7)
        ).order_by('-transaction_date')[:10]
        
        # Get statistics
        total_transactions = FuelTransaction.objects.count()
        pending_transactions = FuelTransaction.objects.filter(status='PENDING').count()
        approved_transactions = FuelTransaction.objects.filter(status='APPROVED').count()
        
        # Get active sub-centers
        active_centers = SubCenter.objects.filter(is_active=True).count()
        
        dashboard_data = {
            'statistics': {
                'total_transactions': total_transactions,
                'pending_transactions': pending_transactions,
                'approved_transactions': approved_transactions,
                'active_centers': active_centers,
                'approval_rate': round((approved_transactions / max(total_transactions, 1)) * 100, 1)
            },
            'recent_transactions': [
                {
                    'id': t.id,
                    'employee_no': t.employee_no,
                    'fuel_amount': float(t.fuel_amount),
                    'status': t.status,
                    'date': t.transaction_date.isoformat()
                } for t in recent_transactions
            ],
            'alerts': [
                {
                    'level': alert.level,
                    'title': alert.title,
                    'message': alert.message,
                    'created_at': alert.created_at.isoformat()
                } for alert in SystemAlert.objects.filter(
                    is_active=True
                ).order_by('-created_at')[:5]
            ]
        }
        
        return Response({
            'status': 'success',
            'data': dashboard_data
        })
        
    except Exception as e:
        logger.error(f"Error getting BC dashboard data: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

class BCDashboardView(TemplateView):
    """
    Template view for Business Central iframe integration
    """
    template_name = 'bc_integration/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({
            'api_base_url': settings.SITE_URL,
            'bc_integration': True,
            'iframe_mode': True
        })
        return context

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bc_transaction_approve(request, transaction_id):
    """
    Approve a transaction and sync back to BC
    """
    try:
        transaction = FuelTransaction.objects.get(id=transaction_id)
        transaction.status = 'APPROVED'
        transaction.approved_by = request.user
        transaction.approved_at = datetime.now()
        transaction.save()
        
        # Create audit log
        AuditLog.objects.create(
            action='APPROVE',
            object_type='FuelTransaction',
            object_id=str(transaction.id),
            details=f"Transaction approved by {request.user.email}",
            user=request.user
        )
        
        # TODO: Send webhook back to BC to update status
        # send_bc_update_webhook(transaction)
        
        return Response({
            'status': 'success',
            'message': 'Transaction approved successfully'
        })
        
    except FuelTransaction.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Transaction not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error approving transaction: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def bc_health_check(request):
    """
    Health check endpoint for BC integration
    """
    try:
        # Check database connectivity
        transaction_count = FuelTransaction.objects.count()
        
        # Check recent activity
        recent_activity = FuelTransaction.objects.filter(
            updated_at__gte=datetime.now() - timedelta(hours=1)
        ).count()
        
        return Response({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'database': 'connected',
            'transaction_count': transaction_count,
            'recent_activity': recent_activity,
            'version': '2.0.0'
        })
        
    except Exception as e:
        logger.error(f"BC health check failed: {str(e)}")
        return Response({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)
