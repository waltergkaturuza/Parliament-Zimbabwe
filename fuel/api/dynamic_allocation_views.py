"""
Dynamic Fuel Allocation System - API Views

RESTful API endpoints for the Dynamic Fuel Allocation System providing:
- Allocation rule management
- Preview/commit workflow
- Calculation engine access
- Analytics and reporting

Designed for TypeScript frontend integration with comprehensive data structures.
"""

from rest_framework import status, generics, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from datetime import date, datetime, timedelta
from decimal import Decimal
import logging

from ..models import (
    FuelAllocationRule, FuelPrice, DynamicAllocation, 
    BeneficiaryProfile, HarmonizedBeneficiaryProfile,
    ParliamentSession, User
)
from ..utils.dynamic_allocation import (
    AllocationCalculationEngine, AllocationPreviewManager,
    AllocationRuleManager, AllocationAnalytics
)
from ..serializers import (
    FuelAllocationRuleSerializer, FuelPriceSerializer,
    DynamicAllocationSerializer, BeneficiaryProfileSerializer
)

logger = logging.getLogger(__name__)


class FuelAllocationRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing fuel allocation rules.
    Supports full CRUD operations and rule validation.
    """
    queryset = FuelAllocationRule.objects.all()
    serializer_class = FuelAllocationRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter rules based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by rule type
        rule_type = self.request.query_params.get('rule_type')
        if rule_type:
            queryset = queryset.filter(rule_type=rule_type)
        
        # Filter by effective date
        effective_date = self.request.query_params.get('effective_date')
        if effective_date:
            try:
                date_obj = datetime.strptime(effective_date, '%Y-%m-%d').date()
                queryset = queryset.filter(
                    effective_from__lte=date_obj,
                ).filter(
                    Q(effective_until__isnull=True) | Q(effective_until__gte=date_obj)
                )
            except ValueError:
                pass
        
        return queryset.order_by('priority', 'rule_name')
    
    @action(detail=False, methods=['get'])
    def applicable(self, request):
        """Get applicable rules for a beneficiary"""
        beneficiary_id = request.query_params.get('beneficiary_id')
        if beneficiary_id:
            # Custom logic for getting applicable rules
            rules = self.get_queryset().filter(is_active=True)
            serializer = self.get_serializer(rules, many=True)
            return Response(serializer.data)
        return Response(self.get_queryset().filter(is_active=True), many=True)


class FuelPriceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing fuel prices.
    Supports full CRUD operations, price history and current price retrieval.
    """
    queryset = FuelPrice.objects.all()
    serializer_class = FuelPriceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter prices based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by fuel type
        fuel_type = self.request.query_params.get('fuel_type')
        if fuel_type:
            queryset = queryset.filter(fuel_type__in=[fuel_type, 'BOTH'])
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-effective_date')
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current effective fuel price"""
        fuel_type = request.query_params.get('fuel_type', 'DIESEL')
        date_param = request.query_params.get('date')
        
        if date_param:
            try:
                target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            target_date = timezone.now().date()
        
        fuel_price = FuelPrice.get_current_price(fuel_type=fuel_type, date=target_date)
        
        if not fuel_price:
            return Response(
                {'error': f'No fuel price found for {fuel_type} on {target_date}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'fuel_price': FuelPriceSerializer(fuel_price).data,
            'query': {
                'fuel_type': fuel_type,
                'date': target_date.isoformat()
            }
        })
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-effective_date')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_current_fuel_price(request):
    """
    Get current effective fuel price.
    
    Query parameters:
    - fuel_type: PETROL, DIESEL, or BOTH (default: DIESEL)
    - date: YYYY-MM-DD (default: today)
    """
    fuel_type = request.query_params.get('fuel_type', 'DIESEL')
    date_param = request.query_params.get('date')
    
    if date_param:
        try:
            target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        target_date = timezone.now().date()
    
    fuel_price = FuelPrice.get_current_price(fuel_type=fuel_type, date=target_date)
    
    if not fuel_price:
        return Response(
            {'error': f'No fuel price found for {fuel_type} on {target_date}'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response({
        'fuel_price': FuelPriceSerializer(fuel_price).data,
        'query': {
            'fuel_type': fuel_type,
            'date': target_date.isoformat()
        }
    })


class AllocationCalculationView(APIView):
    """
    API endpoint for allocation calculations.
    Provides preview calculations without saving to database.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Calculate allocation for given parameters.
        
        Expected payload:
        {
            "beneficiary_id": int,
            "rule_id": int,
            "period_start": "YYYY-MM-DD",
            "period_end": "YYYY-MM-DD",
            "parliament_session_id": int (optional),
            "fuel_price_id": int (optional),
            "custom_parameters": {...} (optional)
        }
        """
        try:
            # Extract and validate request data
            beneficiary_id = request.data.get('beneficiary_id')
            rule_id = request.data.get('rule_id')
            period_start = request.data.get('period_start')
            period_end = request.data.get('period_end')
            
            if not all([beneficiary_id, rule_id, period_start, period_end]):
                return Response(
                    {'error': 'Missing required fields: beneficiary_id, rule_id, period_start, period_end'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get objects
            beneficiary = get_object_or_404(User, id=beneficiary_id, role='BENEFICIARY')
            rule = get_object_or_404(FuelAllocationRule, id=rule_id)
            
            # Parse dates
            try:
                period_start_date = datetime.strptime(period_start, '%Y-%m-%d').date()
                period_end_date = datetime.strptime(period_end, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get optional objects
            parliament_session = None
            if request.data.get('parliament_session_id'):
                parliament_session = get_object_or_404(
                    ParliamentSession, 
                    id=request.data['parliament_session_id']
                )
            
            fuel_price = None
            if request.data.get('fuel_price_id'):
                fuel_price = get_object_or_404(FuelPrice, id=request.data['fuel_price_id'])
            
            # Generate preview
            preview_manager = AllocationPreviewManager()
            preview_result = preview_manager.generate_preview_for_beneficiary(
                beneficiary=beneficiary,
                rule=rule,
                period_start=period_start_date,
                period_end=period_end_date,
                parliament_session=parliament_session,
                fuel_price=fuel_price
            )
            
            if not preview_result['success']:
                return Response(
                    {'error': preview_result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Serialize the preview allocation
            allocation_data = {
                'allocation_id': 'PREVIEW',
                'beneficiary': preview_result['beneficiary_summary'],
                'allocation_details': {
                    'base_litres': float(preview_result['allocation_preview'].base_allocation_litres),
                    'session_supplement': float(preview_result['allocation_preview'].session_supplement_litres),
                    'total_litres': float(preview_result['allocation_preview'].total_allocation_litres),
                    'value_usd': float(preview_result['allocation_preview'].allocated_value_usd),
                },
                'calculation_breakdown': preview_result['calculation_result']['calculation_breakdown'],
                'period': {
                    'start_date': period_start,
                    'end_date': period_end,
                    'period_type': rule.period_type,
                },
                'rule_applied': rule.rule_name,
                'status': 'PREVIEW',
            }
            
            return Response({
                'success': True,
                'allocation_preview': allocation_data,
                'calculation_result': preview_result['calculation_result'],
                'metadata': {
                    'calculated_at': timezone.now().isoformat(),
                    'calculated_by': request.user.username
                }
            })
            
        except Exception as e:
            logger.error(f"Allocation calculation error: {str(e)}")
            return Response(
                {'error': f'Calculation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkAllocationPreviewView(APIView):
    """
    Generate allocation previews for multiple beneficiaries.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Generate bulk allocation previews.
        
        Expected payload:
        {
            "beneficiary_ids": [int, int, ...],
            "rule_id": int,
            "period_start": "YYYY-MM-DD",
            "period_end": "YYYY-MM-DD",
            "parliament_session_id": int (optional),
            "fuel_price_id": int (optional),
            "filters": {...} (optional)
        }
        """
        try:
            # Extract request data
            beneficiary_ids = request.data.get('beneficiary_ids', [])
            rule_id = request.data.get('rule_id')
            period_start = request.data.get('period_start')
            period_end = request.data.get('period_end')
            
            if not all([beneficiary_ids, rule_id, period_start, period_end]):
                return Response(
                    {'error': 'Missing required fields'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get beneficiaries
            beneficiaries = User.objects.filter(
                id__in=beneficiary_ids,
                role='BENEFICIARY'
            )
            
            if not beneficiaries.exists():
                return Response(
                    {'error': 'No valid beneficiaries found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get rule
            rule = get_object_or_404(FuelAllocationRule, id=rule_id)
            
            # Parse dates
            try:
                period_start_date = datetime.strptime(period_start, '%Y-%m-%d').date()
                period_end_date = datetime.strptime(period_end, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get optional objects
            parliament_session = None
            if request.data.get('parliament_session_id'):
                parliament_session = get_object_or_404(
                    ParliamentSession, 
                    id=request.data['parliament_session_id']
                )
            
            fuel_price = None
            if request.data.get('fuel_price_id'):
                fuel_price = get_object_or_404(FuelPrice, id=request.data['fuel_price_id'])
            
            # Generate bulk previews
            preview_manager = AllocationPreviewManager()
            bulk_result = preview_manager.generate_bulk_preview(
                beneficiaries=list(beneficiaries),
                rule=rule,
                period_start=period_start_date,
                period_end=period_end_date,
                parliament_session=parliament_session,
                fuel_price=fuel_price
            )
            
            # Format response
            formatted_previews = []
            for preview in bulk_result['previews']:
                allocation = preview['allocation_preview']
                formatted_previews.append({
                    'beneficiary_id': preview['beneficiary_id'],
                    'beneficiary_name': preview['beneficiary_name'],
                    'allocation_details': {
                        'base_litres': float(allocation.base_allocation_litres),
                        'session_supplement': float(allocation.session_supplement_litres),
                        'total_litres': float(allocation.total_allocation_litres),
                        'value_usd': float(allocation.allocated_value_usd),
                    },
                    'calculation_breakdown': preview['calculation_result']['calculation_breakdown'],
                })
            
            return Response({
                'success': bulk_result['success'],
                'summary': {
                    'total_beneficiaries': bulk_result['total_beneficiaries'],
                    'successful_previews': bulk_result['successful_previews'],
                    'failed_previews': bulk_result['failed_previews'],
                    'total_litres': float(bulk_result['summary']['total_litres']),
                    'total_value_usd': float(bulk_result['summary']['total_value_usd']),
                    'average_allocation': float(bulk_result['summary']['average_allocation']),
                },
                'previews': formatted_previews,
                'errors': bulk_result['errors'],
                'metadata': {
                    'generated_at': timezone.now().isoformat(),
                    'generated_by': request.user.username,
                    'rule_applied': rule.rule_name,
                }
            })
            
        except Exception as e:
            logger.error(f"Bulk allocation preview error: {str(e)}")
            return Response(
                {'error': f'Bulk preview failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CommitAllocationView(APIView):
    """
    Commit allocation previews to the database.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Commit allocation previews.
        
        Expected payload:
        {
            "preview_data": {...}, // From preview API response
            "notes": "Optional notes"
        }
        """
        try:
            preview_data = request.data.get('preview_data')
            notes = request.data.get('notes', '')
            
            if not preview_data:
                return Response(
                    {'error': 'preview_data is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Recreate allocation from preview data
            allocation_preview = self._recreate_allocation_from_preview(preview_data, request.user)
            
            if notes:
                allocation_preview.notes = notes
            
            # Commit the allocation
            preview_manager = AllocationPreviewManager()
            commit_result = preview_manager.commit_preview(allocation_preview, request.user)
            
            if not commit_result['success']:
                return Response(
                    {'error': commit_result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'success': True,
                'allocation': DynamicAllocationSerializer(commit_result['allocation']).data,
                'message': 'Allocation successfully committed'
            })
            
        except Exception as e:
            logger.error(f"Allocation commit error: {str(e)}")
            return Response(
                {'error': f'Commit failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _recreate_allocation_from_preview(self, preview_data, user):
        """Recreate DynamicAllocation object from preview data"""
        # This would need to be implemented based on the exact structure
        # of preview_data and the DynamicAllocation model
        pass


class AllocationAnalyticsView(APIView):
    """
    Analytics and reporting for dynamic allocations.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get allocation analytics.
        
        Query parameters:
        - start_date: YYYY-MM-DD
        - end_date: YYYY-MM-DD
        - category: Filter by beneficiary category
        - constituency: Filter by constituency
        """
        try:
            # Parse query parameters
            start_date_param = request.query_params.get('start_date')
            end_date_param = request.query_params.get('end_date')
            
            if not start_date_param or not end_date_param:
                # Default to current month
                today = timezone.now().date()
                start_date = today.replace(day=1)
                end_date = today
            else:
                try:
                    start_date = datetime.strptime(start_date_param, '%Y-%m-%d').date()
                    end_date = datetime.strptime(end_date_param, '%Y-%m-%d').date()
                except ValueError:
                    return Response(
                        {'error': 'Invalid date format. Use YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Build filter criteria
            beneficiary_filter = {}
            if request.query_params.get('category'):
                beneficiary_filter['category'] = request.query_params['category']
            if request.query_params.get('constituency'):
                beneficiary_filter['constituency'] = request.query_params['constituency']
            
            # Get analytics
            analytics = AllocationAnalytics()
            summary = analytics.get_allocation_summary(
                start_date=start_date,
                end_date=end_date,
                beneficiary_filter=beneficiary_filter if beneficiary_filter else None
            )
            
            return Response({
                'success': True,
                'analytics': summary,
                'query_params': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'filters': beneficiary_filter
                }
            })
            
        except Exception as e:
            logger.error(f"Analytics error: {str(e)}")
            return Response(
                {'error': f'Analytics failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_beneficiary_allocation_history(request, beneficiary_id):
    """
    Get allocation history for a specific beneficiary.
    
    Query parameters:
    - months_back: Number of months to look back (default: 12)
    """
    try:
        beneficiary = get_object_or_404(User, id=beneficiary_id, role='BENEFICIARY')
        months_back = int(request.query_params.get('months_back', 12))
        
        analytics = AllocationAnalytics()
        history = analytics.get_beneficiary_allocation_history(
            beneficiary=beneficiary,
            months_back=months_back
        )
        
        return Response({
            'success': True,
            'history': history
        })
        
    except ValueError:
        return Response(
            {'error': 'Invalid months_back parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Beneficiary history error: {str(e)}")
        return Response(
            {'error': f'History retrieval failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_applicable_rules(request, beneficiary_id):
    """
    Get allocation rules applicable to a specific beneficiary.
    
    Query parameters:
    - date: YYYY-MM-DD (default: today)
    """
    try:
        beneficiary = get_object_or_404(User, id=beneficiary_id, role='BENEFICIARY')
        
        # Get beneficiary profile
        profile = None
        if hasattr(beneficiary, 'harmonized_beneficiary_profile'):
            profile = beneficiary.harmonized_beneficiary_profile
        elif hasattr(beneficiary, 'beneficiary_profile'):
            profile = beneficiary.beneficiary_profile
        else:
            return Response(
                {'error': 'Beneficiary has no profile'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Parse date parameter
        date_param = request.query_params.get('date')
        if date_param:
            try:
                target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            target_date = timezone.now().date()
        
        # Get applicable rules
        rule_manager = AllocationRuleManager()
        applicable_rules = rule_manager.get_applicable_rules(profile, target_date)
        
        # Serialize rules
        rules_data = []
        for rule in applicable_rules:
            rules_data.append({
                'id': rule.id,
                'rule_name': rule.rule_name,
                'rule_type': rule.rule_type,
                'description': rule.description,
                'priority': rule.priority,
                'period_type': rule.period_type,
                'effective_from': rule.effective_from.isoformat(),
                'effective_until': rule.effective_until.isoformat() if rule.effective_until else None,
            })
        
        return Response({
            'success': True,
            'beneficiary': {
                'id': beneficiary.id,
                'name': beneficiary.get_full_name(),
                'category': profile.category.name if hasattr(profile, 'category') else None,
                'constituency': profile.constituency.name if hasattr(profile, 'constituency') and profile.constituency else None,
            },
            'applicable_rules': rules_data,
            'query_date': target_date.isoformat(),
            'total_rules': len(rules_data)
        })
        
    except Exception as e:
        logger.error(f"Applicable rules error: {str(e)}")
        return Response(
            {'error': f'Rules retrieval failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
