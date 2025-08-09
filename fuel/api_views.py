# fuel/api_views.py - Specialized API endpoints for frontend features

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from .models import (
    BeneficiaryProfile, CouponAllocation, BeneficiaryCategory,
    SessionAttendance, ParliamentSession, FuelEntitlement
)
from .serializers import (
    BeneficiaryProfileSerializer, CouponAllocationSerializer,
    BeneficiaryCategorySerializer, SessionAttendanceSerializer
)


class BeneficiaryDashboardAPIViewSet(viewsets.ViewSet):
    """
    Specialized API endpoints for the beneficiary dashboard frontend
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def personal_overview(self, request):
        """Get personal overview for beneficiary dashboard"""
        user = request.user
        
        try:
            beneficiary = BeneficiaryProfile.objects.get(user=user)
        except BeneficiaryProfile.DoesNotExist:
            return Response({'error': 'Beneficiary profile not found'}, status=404)
        
        # Get allocations for this beneficiary
        allocations = CouponAllocation.objects.filter(beneficiary=beneficiary)
        
        # Calculate statistics
        total_allocations = allocations.count()
        total_coupons = allocations.aggregate(
            total=Sum('quantity')
        )['total'] or 0
        
        used_coupons = allocations.aggregate(
            used=Sum('coupons_used')
        )['used'] or 0
        
        remaining_coupons = allocations.aggregate(
            remaining=Sum('coupons_remaining')
        )['remaining'] or 0
        
        # Current month statistics
        current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_allocations = allocations.filter(allocation_date__gte=current_month)
        monthly_coupons = monthly_allocations.aggregate(
            total=Sum('quantity')
        )['total'] or 0
        
        # Engine size multiplier calculation
        engine_multiplier = 1.0
        if beneficiary.engine_size:
            if beneficiary.engine_size >= 3.0:
                engine_multiplier = 1.3
            elif beneficiary.engine_size >= 2.0:
                engine_multiplier = 1.2
        
        # Category multiplier
        category_multiplier = 1.0
        if beneficiary.category:
            category_multiplier = float(beneficiary.category.category_multiplier)
        
        return Response({
            'beneficiary': {
                'id': beneficiary.id,
                'name': beneficiary.get_full_name(),
                'role': beneficiary.role,
                'category': beneficiary.category.name if beneficiary.category else None,
                'vehicle': {
                    'make': beneficiary.vehicle_make,
                    'model': beneficiary.vehicle_model,
                    'year': beneficiary.vehicle_year,
                    'engine_size': float(beneficiary.engine_size) if beneficiary.engine_size else None,
                    'registration': beneficiary.vehicle_registration,
                },
                'contact': {
                    'phone': beneficiary.phone_number,
                    'office': beneficiary.office_location,
                    'emergency': beneficiary.emergency_contact,
                },
                'multipliers': {
                    'category_multiplier': category_multiplier,
                    'engine_multiplier': engine_multiplier,
                    'total_multiplier': category_multiplier * engine_multiplier,
                }
            },
            'statistics': {
                'total_allocations': total_allocations,
                'total_coupons': total_coupons,
                'used_coupons': used_coupons,
                'remaining_coupons': remaining_coupons,
                'usage_percentage': round((used_coupons / total_coupons * 100), 1) if total_coupons > 0 else 0,
                'monthly_coupons': monthly_coupons,
            },
            'status': {
                'is_active': beneficiary.is_active,
                'last_allocation': allocations.first().allocation_date if allocations.exists() else None,
            }
        })
    
    @action(detail=False, methods=['get'])
    def allocation_history(self, request):
        """Get allocation history for beneficiary"""
        user = request.user
        
        try:
            beneficiary = BeneficiaryProfile.objects.get(user=user)
        except BeneficiaryProfile.DoesNotExist:
            return Response({'error': 'Beneficiary profile not found'}, status=404)
        
        # Get allocations with pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        allocations = CouponAllocation.objects.filter(
            beneficiary=beneficiary
        ).order_by('-allocation_date')
        
        # Apply pagination
        start = (page - 1) * page_size
        end = start + page_size
        paginated_allocations = allocations[start:end]
        
        allocation_data = []
        for allocation in paginated_allocations:
            allocation_data.append(allocation.get_allocation_details())
        
        return Response({
            'allocations': allocation_data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': allocations.count(),
                'has_next': end < allocations.count(),
                'has_previous': page > 1,
            }
        })
    
    @action(detail=False, methods=['get'])
    def attendance_records(self, request):
        """Get attendance records for beneficiary"""
        user = request.user
        
        try:
            beneficiary = BeneficiaryProfile.objects.get(user=user)
        except BeneficiaryProfile.DoesNotExist:
            return Response({'error': 'Beneficiary profile not found'}, status=404)
        
        # Get recent attendance records
        attendance_records = SessionAttendance.objects.filter(
            beneficiary=beneficiary
        ).select_related('session').order_by('-session__date')[:20]
        
        attendance_data = []
        for record in attendance_records:
            attendance_data.append({
                'id': record.id,
                'session': {
                    'id': record.session.id,
                    'name': record.session.session_name,
                    'date': record.session.date,
                    'type': record.session.session_type,
                },
                'attendance_status': record.attendance_status,
                'check_in_time': record.check_in_time,
                'check_out_time': record.check_out_time,
                'notes': record.notes,
            })
        
        # Calculate attendance statistics
        total_sessions = attendance_records.count()
        attended_sessions = attendance_records.filter(attendance_status='PRESENT').count()
        attendance_rate = round((attended_sessions / total_sessions * 100), 1) if total_sessions > 0 else 0
        
        return Response({
            'attendance_records': attendance_data,
            'statistics': {
                'total_sessions': total_sessions,
                'attended_sessions': attended_sessions,
                'missed_sessions': total_sessions - attended_sessions,
                'attendance_rate': attendance_rate,
            }
        })
    
    @action(detail=False, methods=['get'])
    def upcoming_sessions(self, request):
        """Get upcoming parliament sessions"""
        upcoming_sessions = ParliamentSession.objects.filter(
            date__gte=timezone.now().date()
        ).order_by('date')[:10]
        
        session_data = []
        for session in upcoming_sessions:
            session_data.append({
                'id': session.id,
                'name': session.session_name,
                'date': session.date,
                'start_time': session.start_time,
                'end_time': session.end_time,
                'type': session.session_type,
                'location': session.location,
                'description': session.description,
            })
        
        return Response({
            'upcoming_sessions': session_data
        })


class SubCenterBeneficiaryAPIViewSet(viewsets.ViewSet):
    """
    Specialized API endpoints for subcenter beneficiary management
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def beneficiary_list(self, request):
        """Get list of beneficiaries for subcenter management"""
        user = request.user
        
        if not user.sub_center:
            return Response({'error': 'No subcenter assigned'}, status=400)
        
        beneficiaries = BeneficiaryProfile.objects.filter(
            sub_center=user.sub_center,
            is_active=True
        ).select_related('category', 'user')
        
        # Apply filters
        category_filter = request.query_params.get('category')
        role_filter = request.query_params.get('role')
        search = request.query_params.get('search')
        
        if category_filter:
            beneficiaries = beneficiaries.filter(category__name=category_filter)
        
        if role_filter:
            beneficiaries = beneficiaries.filter(role=role_filter)
        
        if search:
            beneficiaries = beneficiaries.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(vehicle_make__icontains=search) |
                Q(vehicle_model__icontains=search)
            )
        
        beneficiary_data = []
        for beneficiary in beneficiaries:
            # Get recent allocation
            recent_allocation = CouponAllocation.objects.filter(
                beneficiary=beneficiary
            ).first()
            
            beneficiary_data.append({
                'id': beneficiary.id,
                'name': beneficiary.get_full_name(),
                'role': beneficiary.role,
                'category': beneficiary.category.name if beneficiary.category else None,
                'vehicle': {
                    'info': f"{beneficiary.vehicle_make} {beneficiary.vehicle_model} ({beneficiary.vehicle_year})" if beneficiary.vehicle_make else "No vehicle info",
                    'engine_size': float(beneficiary.engine_size) if beneficiary.engine_size else None,
                    'registration': beneficiary.vehicle_registration,
                },
                'contact': {
                    'phone': beneficiary.phone_number,
                    'office': beneficiary.office_location,
                },
                'last_allocation': {
                    'date': recent_allocation.allocation_date if recent_allocation else None,
                    'quantity': recent_allocation.quantity if recent_allocation else 0,
                    'remaining': recent_allocation.coupons_remaining if recent_allocation else 0,
                } if recent_allocation else None,
                'is_active': beneficiary.is_active,
            })
        
        return Response({
            'beneficiaries': beneficiary_data,
            'summary': {
                'total_beneficiaries': len(beneficiary_data),
                'by_category': {},  # Could add category breakdown
                'by_role': {},      # Could add role breakdown
            }
        })
    
    @action(detail=False, methods=['post'])
    def bulk_allocate(self, request):
        """Perform bulk allocation to multiple beneficiaries"""
        user = request.user
        
        if not user.sub_center:
            return Response({'error': 'No subcenter assigned'}, status=400)
        
        allocation_data = request.data.get('allocations', [])
        session_name = request.data.get('session_name', '')
        program_name = request.data.get('program_name', '')
        allocation_type = request.data.get('allocation_type', 'MONTHLY')
        
        created_allocations = []
        errors = []
        
        for item in allocation_data:
            try:
                beneficiary_id = item.get('beneficiary_id')
                quantity = item.get('quantity')
                
                beneficiary = BeneficiaryProfile.objects.get(
                    id=beneficiary_id,
                    sub_center=user.sub_center
                )
                
                allocation = CouponAllocation.objects.create(
                    beneficiary=beneficiary,
                    sub_center=user.sub_center,
                    quantity=quantity,
                    session_name=session_name,
                    program_name=program_name,
                    allocation_type=allocation_type,
                    coupons_remaining=quantity,
                    status='PENDING'
                )
                
                created_allocations.append({
                    'beneficiary': beneficiary.get_full_name(),
                    'quantity': quantity,
                    'allocation_id': allocation.id
                })
                
            except Exception as e:
                errors.append({
                    'beneficiary_id': item.get('beneficiary_id'),
                    'error': str(e)
                })
        
        return Response({
            'created_allocations': created_allocations,
            'errors': errors,
            'summary': {
                'total_requested': len(allocation_data),
                'successful': len(created_allocations),
                'failed': len(errors),
            }
        })
