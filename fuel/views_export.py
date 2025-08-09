# fuel/views_export.py
"""
Export and download views for the fuel coupon system.
Handles CSV, Excel, PDF exports and printing functionality.
"""

from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import (
    Coupon, SubCenter, Book, Box, User, FuelData, CouponDistribution, 
    FuelTransaction, SubCenterOfficer, BeneficiaryProfile, AuditLog,
    BookDispatch, CouponAllocation, FuelEntitlement
)
from .utils.export_utils import ExportManager, CouponPrintManager
from .permissions import IsAuthenticated


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_coupons(request):
    """Export coupons data in various formats"""
    export_format = request.GET.get('format', 'csv')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    status_filter = request.GET.get('status')
    subcenter_id = request.GET.get('subcenter')
    
    # Build queryset with filters
    queryset = Coupon.objects.select_related('book', 'book__sub_center').all()
    
    if date_from:
        try:
            date_from = datetime.strptime(date_from, '%Y-%m-%d')
            queryset = queryset.filter(created_at__gte=date_from)
        except ValueError:
            pass
    
    if date_to:
        try:
            date_to = datetime.strptime(date_to, '%Y-%m-%d')
            queryset = queryset.filter(created_at__lte=date_to)
        except ValueError:
            pass
    
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    if subcenter_id:
        queryset = queryset.filter(book__sub_center_id=subcenter_id)
    
    # Apply user permissions
    user = request.user
    if user.role == 'SUB_CENTER' and user.sub_center:
        queryset = queryset.filter(book__sub_center=user.sub_center)
    
    # Convert to list of dictionaries
    data = []
    for coupon in queryset:
        data.append({
            'coupon_number': coupon.coupon_number,
            'book_number': coupon.book.book_number if coupon.book else 'N/A',
            'subcenter': coupon.book.sub_center.name if coupon.book and coupon.book.sub_center else 'N/A',
            'fuel_type': coupon.fuel_type,
            'liters': str(coupon.liters),
            'rate_per_liter': str(coupon.rate_per_liter),
            'total_amount': str(coupon.total_amount),
            'status': coupon.status,
            'created_at': coupon.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'employee_name': coupon.employee_name or 'N/A',
            'employee_number': coupon.employee_number or 'N/A',
            'vehicle_registration': coupon.vehicle_registration or 'N/A'
        })
    
    # Export based on format
    filename = f"coupons_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    if export_format == 'csv':
        return ExportManager.export_to_csv(data, f"{filename}.csv")
    elif export_format == 'excel':
        return ExportManager.export_to_excel(data, f"{filename}.xlsx", "Fuel Coupons")
    elif export_format == 'pdf':
        return ExportManager.export_to_pdf(data, f"{filename}.pdf", "Fuel Coupons Report")
    else:
        return Response({'error': 'Invalid format'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_transactions(request):
    """Export fuel transactions data"""
    export_format = request.GET.get('format', 'csv')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    subcenter_id = request.GET.get('subcenter')
    
    # Build queryset
    queryset = FuelTransaction.objects.select_related('coupon', 'coupon__book', 'user').all()
    
    if date_from:
        try:
            date_from = datetime.strptime(date_from, '%Y-%m-%d')
            queryset = queryset.filter(transaction_date__gte=date_from)
        except ValueError:
            pass
    
    if date_to:
        try:
            date_to = datetime.strptime(date_to, '%Y-%m-%d')
            queryset = queryset.filter(transaction_date__lte=date_to)
        except ValueError:
            pass
    
    if subcenter_id:
        queryset = queryset.filter(coupon__book__sub_center_id=subcenter_id)
    
    # Apply user permissions
    user = request.user
    if user.role == 'SUB_CENTER' and user.sub_center:
        queryset = queryset.filter(coupon__book__sub_center=user.sub_center)
    
    # Convert to list of dictionaries
    data = []
    for transaction in queryset:
        data.append({
            'transaction_id': transaction.id,
            'coupon_number': transaction.coupon.coupon_number if transaction.coupon else 'N/A',
            'fuel_type': transaction.fuel_type,
            'liters_dispensed': str(transaction.liters_dispensed),
            'amount': str(transaction.amount),
            'transaction_date': transaction.transaction_date.strftime('%Y-%m-%d %H:%M:%S'),
            'station_name': transaction.station_name or 'N/A',
            'pump_attendant': transaction.pump_attendant or 'N/A',
            'user': transaction.user.username if transaction.user else 'N/A',
            'subcenter': transaction.coupon.book.sub_center.name if transaction.coupon and transaction.coupon.book and transaction.coupon.book.sub_center else 'N/A'
        })
    
    filename = f"transactions_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    if export_format == 'csv':
        return ExportManager.export_to_csv(data, f"{filename}.csv")
    elif export_format == 'excel':
        return ExportManager.export_to_excel(data, f"{filename}.xlsx", "Fuel Transactions")
    elif export_format == 'pdf':
        return ExportManager.export_to_pdf(data, f"{filename}.pdf", "Fuel Transactions Report")
    else:
        return Response({'error': 'Invalid format'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_users(request):
    """Export users data"""
    export_format = request.GET.get('format', 'csv')
    role_filter = request.GET.get('role')
    subcenter_id = request.GET.get('subcenter')
    
    # Build queryset
    queryset = User.objects.select_related('sub_center').all()
    
    if role_filter:
        queryset = queryset.filter(role=role_filter)
    
    if subcenter_id:
        queryset = queryset.filter(sub_center_id=subcenter_id)
    
    # Apply user permissions
    user = request.user
    if user.role == 'SUB_CENTER' and user.sub_center:
        queryset = queryset.filter(sub_center=user.sub_center)
    
    # Convert to list of dictionaries
    data = []
    for user_obj in queryset:
        data.append({
            'username': user_obj.username,
            'email': user_obj.email,
            'first_name': user_obj.first_name,
            'last_name': user_obj.last_name,
            'role': user_obj.role,
            'subcenter': user_obj.sub_center.name if user_obj.sub_center else 'N/A',
            'is_active': 'Yes' if user_obj.is_active else 'No',
            'is_approved': 'Yes' if user_obj.is_approved else 'No',
            'date_joined': user_obj.date_joined.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    filename = f"users_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    if export_format == 'csv':
        return ExportManager.export_to_csv(data, f"{filename}.csv")
    elif export_format == 'excel':
        return ExportManager.export_to_excel(data, f"{filename}.xlsx", "System Users")
    elif export_format == 'pdf':
        return ExportManager.export_to_pdf(data, f"{filename}.pdf", "System Users Report")
    else:
        return Response({'error': 'Invalid format'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_beneficiaries(request):
    """Export beneficiaries data"""
    export_format = request.GET.get('format', 'csv')
    category_id = request.GET.get('category')
    constituency_id = request.GET.get('constituency')
    
    # Build queryset
    queryset = BeneficiaryProfile.objects.select_related(
        'category', 'constituency', 'user'
    ).all()
    
    if category_id:
        queryset = queryset.filter(category_id=category_id)
    
    if constituency_id:
        queryset = queryset.filter(constituency_id=constituency_id)
    
    # Convert to list of dictionaries
    data = []
    for beneficiary in queryset:
        data.append({
            'title': beneficiary.title or 'N/A',
            'full_name': beneficiary.full_name,
            'category': beneficiary.category.name if beneficiary.category else 'N/A',
            'constituency': beneficiary.constituency.name if beneficiary.constituency else 'N/A',
            'email': beneficiary.user.email if beneficiary.user else 'N/A',
            'phone_number': beneficiary.phone_number or 'N/A',
            'employee_number': beneficiary.employee_number or 'N/A',
            'is_active': 'Yes' if beneficiary.is_active else 'No',
            'created_at': beneficiary.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    filename = f"beneficiaries_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    if export_format == 'csv':
        return ExportManager.export_to_csv(data, f"{filename}.csv")
    elif export_format == 'excel':
        return ExportManager.export_to_excel(data, f"{filename}.xlsx", "Beneficiaries")
    elif export_format == 'pdf':
        return ExportManager.export_to_pdf(data, f"{filename}.pdf", "Beneficiaries Report")
    else:
        return Response({'error': 'Invalid format'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_books(request):
    """Export books data"""
    export_format = request.GET.get('format', 'csv')
    subcenter_id = request.GET.get('subcenter')
    status_filter = request.GET.get('status')
    
    # Build queryset
    queryset = Book.objects.select_related('sub_center', 'box').all()
    
    if subcenter_id:
        queryset = queryset.filter(sub_center_id=subcenter_id)
    
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    # Apply user permissions
    user = request.user
    if user.role == 'SUB_CENTER' and user.sub_center:
        queryset = queryset.filter(sub_center=user.sub_center)
    
    # Convert to list of dictionaries
    data = []
    for book in queryset:
        coupon_count = book.coupons.count()
        used_coupons = book.coupons.filter(status='USED').count()
        
        data.append({
            'book_number': book.book_number,
            'subcenter': book.sub_center.name if book.sub_center else 'N/A',
            'box_number': book.box.box_number if book.box else 'N/A',
            'number_of_coupons': book.number_of_coupons,
            'issued_coupons': coupon_count,
            'used_coupons': used_coupons,
            'remaining_coupons': book.number_of_coupons - coupon_count,
            'status': book.status,
            'created_at': book.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    filename = f"books_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    if export_format == 'csv':
        return ExportManager.export_to_csv(data, f"{filename}.csv")
    elif export_format == 'excel':
        return ExportManager.export_to_excel(data, f"{filename}.xlsx", "Coupon Books")
    elif export_format == 'pdf':
        return ExportManager.export_to_pdf(data, f"{filename}.pdf", "Coupon Books Report")
    else:
        return Response({'error': 'Invalid format'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def print_coupon(request):
    """Generate printable coupon PDF"""
    coupon_id = request.data.get('coupon_id')
    
    if not coupon_id:
        return Response({'error': 'Coupon ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        coupon = Coupon.objects.select_related('book', 'book__sub_center').get(id=coupon_id)
        
        # Check permissions
        user = request.user
        if user.role == 'SUB_CENTER' and user.sub_center:
            if coupon.book.sub_center != user.sub_center:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        coupon_data = {
            'coupon_number': coupon.coupon_number,
            'employee_name': coupon.employee_name,
            'fuel_type': coupon.fuel_type,
            'liters': coupon.liters,
            'valid_until': coupon.created_at + timedelta(days=30),  # Example validity
            'subcenter': coupon.book.sub_center.name if coupon.book.sub_center else 'N/A'
        }
        
        return CouponPrintManager.generate_coupon_pdf(coupon_data)
        
    except Coupon.DoesNotExist:
        return Response({'error': 'Coupon not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def print_handover_report(request):
    """Generate handover report PDF"""
    handover_id = request.data.get('handover_id')
    
    if not handover_id:
        return Response({'error': 'Handover ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Assuming you have a Handover model, adjust as needed
        handover_data = {
            'handover_id': handover_id,
            'handover_date': datetime.now().strftime('%Y-%m-%d'),
            'from_officer': request.user.get_full_name() or request.user.username,
            'to_officer': request.data.get('to_officer', 'N/A'),
            'total_coupons': request.data.get('total_coupons', 0),
            'total_value': request.data.get('total_value', 0)
        }
        
        return CouponPrintManager.generate_handover_report(handover_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_dashboard_data(request):
    """Export dashboard summary data"""
    export_format = request.GET.get('format', 'csv')
    
    user = request.user
    
    # Get dashboard statistics
    if user.role == 'SUB_CENTER' and user.sub_center:
        # Sub-center specific data
        coupons = Coupon.objects.filter(book__sub_center=user.sub_center)
        transactions = FuelTransaction.objects.filter(coupon__book__sub_center=user.sub_center)
        books = Book.objects.filter(sub_center=user.sub_center)
    else:
        # System-wide data
        coupons = Coupon.objects.all()
        transactions = FuelTransaction.objects.all()
        books = Book.objects.all()
    
    # Calculate statistics
    total_coupons = coupons.count()
    used_coupons = coupons.filter(status='USED').count()
    pending_coupons = coupons.filter(status='PENDING').count()
    total_transactions = transactions.count()
    total_fuel_dispensed = transactions.aggregate(Sum('liters_dispensed'))['liters_dispensed__sum'] or 0
    total_amount = transactions.aggregate(Sum('amount'))['amount__sum'] or 0
    total_books = books.count()
    active_books = books.filter(status='ACTIVE').count()
    
    data = [{
        'metric': 'Total Coupons',
        'value': total_coupons,
        'description': 'Total number of coupons in the system'
    }, {
        'metric': 'Used Coupons',
        'value': used_coupons,
        'description': 'Number of coupons that have been used'
    }, {
        'metric': 'Pending Coupons',
        'value': pending_coupons,
        'description': 'Number of coupons awaiting use'
    }, {
        'metric': 'Total Transactions',
        'value': total_transactions,
        'description': 'Total number of fuel transactions'
    }, {
        'metric': 'Total Fuel Dispensed (Liters)',
        'value': float(total_fuel_dispensed),
        'description': 'Total amount of fuel dispensed'
    }, {
        'metric': 'Total Amount (USD)',
        'value': float(total_amount),
        'description': 'Total monetary value of transactions'
    }, {
        'metric': 'Total Books',
        'value': total_books,
        'description': 'Total number of coupon books'
    }, {
        'metric': 'Active Books',
        'value': active_books,
        'description': 'Number of active coupon books'
    }]
    
    filename = f"dashboard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    if export_format == 'csv':
        return ExportManager.export_to_csv(data, f"{filename}.csv")
    elif export_format == 'excel':
        return ExportManager.export_to_excel(data, f"{filename}.xlsx", "Dashboard Summary")
    elif export_format == 'pdf':
        return ExportManager.export_to_pdf(data, f"{filename}.pdf", "Dashboard Summary Report")
    else:
        return Response({'error': 'Invalid format'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_template(request):
    """Download CSV templates for bulk import"""
    template_type = request.GET.get('type', 'coupons')
    
    templates = {
        'coupons': {
            'headers': ['coupon_number', 'fuel_type', 'liters', 'rate_per_liter', 'employee_name', 'employee_number', 'vehicle_registration'],
            'sample_data': [
                ['CPN001', 'PETROL', '50', '1.45', 'John Doe', 'EMP001', 'ABC123'],
                ['CPN002', 'DIESEL', '75', '1.35', 'Jane Smith', 'EMP002', 'XYZ789']
            ]
        },
        'users': {
            'headers': ['username', 'email', 'first_name', 'last_name', 'role', 'subcenter_name'],
            'sample_data': [
                ['jdoe', 'john.doe@parliament.gov.zw', 'John', 'Doe', 'SUB_CENTER', 'Harare Center'],
                ['jsmith', 'jane.smith@parliament.gov.zw', 'Jane', 'Smith', 'SUB_CENTER', 'Bulawayo Center']
            ]
        },
        'beneficiaries': {
            'headers': ['title', 'full_name', 'category_name', 'constituency_name', 'email', 'phone_number', 'employee_number'],
            'sample_data': [
                ['Hon.', 'John Doe', 'MP', 'Harare East', 'john.doe@parliament.gov.zw', '+263712345678', 'MP001'],
                ['Dr.', 'Jane Smith', 'Senator', 'Bulawayo', 'jane.smith@parliament.gov.zw', '+263787654321', 'SEN001']
            ]
        }
    }
    
    if template_type not in templates:
        return Response({'error': 'Invalid template type'}, status=status.HTTP_400_BAD_REQUEST)
    
    template = templates[template_type]
    data = [dict(zip(template['headers'], row)) for row in template['sample_data']]
    
    filename = f"{template_type}_import_template.csv"
    return ExportManager.export_to_csv(data, filename)
