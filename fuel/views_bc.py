from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.clickjacking import xframe_options_exempt
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from django.utils import timezone
import json
import logging

from .models import FuelTransaction, User, Book, Coupon
# from .services.business_central import BusinessCentralAPI  # Will be implemented

logger = logging.getLogger(__name__)

@method_decorator([xframe_options_exempt, csrf_exempt], name='dispatch')
class BCEmbeddedDashboardView(View):
    """Main dashboard view embedded in Business Central"""
    
    def get(self, request):
        # Get BC context from query parameters
        bc_user_id = request.GET.get('bc_user_id')
        bc_company_id = request.GET.get('bc_company_id')
        bc_environment = request.GET.get('bc_environment')
        
        # Get dashboard statistics
        total_transactions = FuelTransaction.objects.count()
        total_users = User.objects.filter(is_active=True).count()
        total_books = Book.objects.count()
        total_coupons = Coupon.objects.count()
        
        # Get recent transactions
        recent_transactions = FuelTransaction.objects.select_related('user', 'book').order_by('-created_at')[:5]
        
        context = {
            'is_bc_embedded': True,
            'bc_context': {
                'user_id': bc_user_id,
                'company_id': bc_company_id,
                'environment': bc_environment,
            },
            'stats': {
                'total_transactions': total_transactions,
                'total_users': total_users,
                'total_books': total_books,
                'total_coupons': total_coupons,
            },
            'recent_transactions': recent_transactions,
            'hide_navigation': True,
        }
        
        return render(request, 'fuel/bc_embedded/dashboard.html', context)
    
    def post(self, request):
        """Handle BC integration events"""
        try:
            data = json.loads(request.body)
            event_type = data.get('event_type')
            
            if event_type == 'sync_request':
                return self.handle_sync_request(data)
            elif event_type == 'user_context':
                return self.handle_user_context(data)
            
            return JsonResponse({'status': 'success'})
            
        except Exception as e:
            logger.error(f"BC embedded dashboard error: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    def handle_sync_request(self, data):
        """Handle synchronization request from BC"""
        try:
            bc_api = BusinessCentralAPI()
            sync_result = bc_api.sync_all_data()
            
            return JsonResponse({
                'status': 'success',
                'sync_result': sync_result
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Sync failed: {str(e)}'
            })
    
    def handle_user_context(self, data):
        """Handle user context from BC"""
        bc_user_id = data.get('bc_user_id')
        
        # Map BC user to Django user
        try:
            user = User.objects.get(bc_user_id=bc_user_id)
            user_stats = {
                'name': user.get_full_name(),
                'department': user.department,
                'fuel_allowance': user.fuel_allowance,
                'transactions_count': user.fuel_transactions.count(),
            }
            
            return JsonResponse({
                'status': 'success',
                'user_stats': user_stats
            })
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'User not found'
            })


@xframe_options_exempt
@csrf_exempt
def bc_transaction_list(request):
    """Fuel transactions list optimized for BC"""
    bc_company_id = request.GET.get('company_id')
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 10))
    
    # Filter by company if provided
    transactions = FuelTransaction.objects.select_related('user', 'book')
    if bc_company_id:
        transactions = transactions.filter(bc_company_id=bc_company_id)
    
    # Pagination
    start = (page - 1) * per_page
    end = start + per_page
    paginated_transactions = transactions[start:end]
    
    context = {
        'transactions': paginated_transactions,
        'is_bc_embedded': True,
        'total_count': transactions.count(),
        'page': page,
        'per_page': per_page,
        'has_next': transactions.count() > end,
        'has_previous': page > 1,
    }
    
    return render(request, 'fuel/bc_embedded/transaction_list.html', context)


@xframe_options_exempt
@csrf_exempt
def bc_transaction_form(request):
    """Transaction creation form for BC"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Create transaction from BC data
            transaction = FuelTransaction.objects.create(
                user_id=data['user_id'],
                book_id=data['book_id'],
                amount=data['amount'],
                transaction_type=data.get('transaction_type', 'FUEL_PURCHASE'),
                bc_reference=data.get('bc_reference'),
                bc_company_id=data.get('bc_company_id'),
                notes=data.get('notes', ''),
            )
            
            # Sync back to BC
            bc_api = BusinessCentralAPI()
            bc_api.create_transaction(transaction)
            
            return JsonResponse({
                'status': 'success',
                'transaction_id': transaction.id,
                'message': 'Transaction created successfully'
            })
            
        except Exception as e:
            logger.error(f"BC transaction creation error: {e}")
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            })
    
    # GET request - show form
    users = User.objects.filter(is_active=True).order_by('first_name', 'last_name')
    books = Book.objects.filter(is_active=True).order_by('book_number')
    
    context = {
        'users': users,
        'books': books,
        'is_bc_embedded': True,
    }
    
    return render(request, 'fuel/bc_embedded/transaction_form.html', context)


@xframe_options_exempt
@csrf_exempt
def bc_reports(request):
    """Reports view for BC integration"""
    report_type = request.GET.get('type', 'summary')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    bc_company_id = request.GET.get('company_id')
    
    # Base queryset
    transactions = FuelTransaction.objects.select_related('user', 'book')
    if bc_company_id:
        transactions = transactions.filter(bc_company_id=bc_company_id)
    
    # Date filtering
    if date_from:
        transactions = transactions.filter(created_at__date__gte=date_from)
    if date_to:
        transactions = transactions.filter(created_at__date__lte=date_to)
    
    if report_type == 'summary':
        # Summary report
        report_data = {
            'total_transactions': transactions.count(),
            'total_amount': sum(t.amount for t in transactions),
            'by_department': {},
            'by_month': {},
        }
        
        # Group by department
        for transaction in transactions:
            dept = transaction.user.department or 'Unknown'
            if dept not in report_data['by_department']:
                report_data['by_department'][dept] = {'count': 0, 'amount': 0}
            report_data['by_department'][dept]['count'] += 1
            report_data['by_department'][dept]['amount'] += transaction.amount
    
    elif report_type == 'detailed':
        # Detailed report
        report_data = {
            'transactions': transactions.order_by('-created_at'),
        }
    
    context = {
        'report_type': report_type,
        'report_data': report_data,
        'is_bc_embedded': True,
        'date_from': date_from,
        'date_to': date_to,
    }
    
    return render(request, 'fuel/bc_embedded/reports.html', context)


@csrf_exempt
def bc_api_sync(request):
    """API endpoint for BC synchronization"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        data = json.loads(request.body)
        sync_type = data.get('sync_type', 'full')
        
        bc_api = BusinessCentralAPI()
        
        if sync_type == 'transactions':
            result = bc_api.sync_transactions()
        elif sync_type == 'users':
            result = bc_api.sync_users()
        elif sync_type == 'full':
            result = bc_api.sync_all_data()
        else:
            return JsonResponse({'error': 'Invalid sync type'}, status=400)
        
        return JsonResponse({
            'status': 'success',
            'result': result,
            'message': f'{sync_type.title()} sync completed successfully'
        })
        
    except Exception as e:
        logger.error(f"BC API sync error: {e}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
def bc_webhook_receiver(request):
    """Receive webhooks from Business Central"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        data = json.loads(request.body)
        event_type = data.get('eventType')
        entity_data = data.get('entityData', {})
        
        logger.info(f"Received BC webhook: {event_type}")
        
        if event_type == 'transaction_updated':
            # Update Django transaction from BC
            transaction_id = entity_data.get('transaction_id')
            bc_status = entity_data.get('status')
            
            try:
                transaction = FuelTransaction.objects.get(id=transaction_id)
                transaction.bc_status = bc_status
                transaction.bc_updated_at = timezone.now()
                transaction.save()
                
                logger.info(f"Updated transaction {transaction_id} status to {bc_status}")
            except FuelTransaction.DoesNotExist:
                logger.warning(f"Transaction {transaction_id} not found for BC update")
        
        elif event_type == 'user_updated':
            # Update Django user from BC
            bc_user_id = entity_data.get('user_id')
            user_data = entity_data.get('user_data', {})
            
            try:
                user = User.objects.get(bc_user_id=bc_user_id)
                for field, value in user_data.items():
                    if hasattr(user, field):
                        setattr(user, field, value)
                user.save()
                
                logger.info(f"Updated user {bc_user_id} from BC")
            except User.DoesNotExist:
                logger.warning(f"User {bc_user_id} not found for BC update")
        
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f"BC webhook error: {e}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
