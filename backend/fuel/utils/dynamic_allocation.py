"""
Dynamic Fuel Allocation System - Business Logic Utilities

This module contains the core business logic for the Dynamic Fuel Allocation System,
implementing complex calculation formulas, preview/commit workflows, and allocation management.

Based on POZ Parliament data analysis with 150+ members, engine capacities from 2200-8000cc,
and distance variations from 20-2400km from Parliament.
"""

from decimal import Decimal
from typing import Dict, List, Optional, Tuple, Any
from datetime import date, datetime, timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum, Avg, Count
import logging

logger = logging.getLogger(__name__)


class AllocationCalculationEngine:
    """
    Core calculation engine for dynamic fuel allocations.
    
    Implements the master formula:
    AA_USD = Mileage × EngineConstant × DistanceFactor
    Litres = AA_USD / FuelPriceUSD + SessionTopUp
    
    With caps, floors, and various adjustment factors.
    """
    
    # Default engine constants from POZ data analysis
    DEFAULT_ENGINE_CONSTANTS = {
        'UNDER_2800': Decimal('0.39'),
        '2800_TO_3199': Decimal('0.43'),
        '3200_AND_ABOVE': Decimal('0.56'),
    }
    
    # Default distance factors
    DEFAULT_DISTANCE_BASE = Decimal('1.0')
    DEFAULT_DISTANCE_PER_KM = Decimal('0.001')
    DEFAULT_MAX_DISTANCE_FACTOR = Decimal('2.0')
    
    # Default limits
    DEFAULT_MIN_ALLOCATION = Decimal('20')
    DEFAULT_MAX_ALLOCATION = Decimal('500')
    DEFAULT_FUEL_PRICE = Decimal('1.40')
    
    def __init__(self, rule=None):
        """Initialize calculation engine with optional rule override"""
        self.rule = rule
    
    def calculate_allocation(
        self,
        beneficiary_profile,
        distance_km: int,
        engine_capacity_cc: int,
        fuel_price_usd: Decimal,
        parliament_session=None,
        custom_parameters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Calculate dynamic fuel allocation using master formula.
        
        Args:
            beneficiary_profile: Beneficiary profile object
            distance_km: Distance from parliament in kilometers
            engine_capacity_cc: Engine capacity in cubic centimeters
            fuel_price_usd: Fuel price per litre in USD
            parliament_session: Optional parliament session for top-ups
            custom_parameters: Override default parameters
            
        Returns:
            Comprehensive calculation breakdown
        """
        try:
            # Get calculation parameters
            params = self._get_calculation_parameters(custom_parameters)
            
            # Get engine constant based on capacity
            engine_constant = self._get_engine_constant(engine_capacity_cc, params)
            
            # Calculate distance factor
            distance_factor = self._calculate_distance_factor(distance_km, params)
            
            # Calculate base AA_USD (Allocation Amount in USD)
            aa_usd = distance_km * engine_constant * distance_factor
            
            # Calculate base litres from USD amount
            base_litres = aa_usd / fuel_price_usd if fuel_price_usd > 0 else Decimal('0')
            
            # Calculate session supplements
            session_litres = self._calculate_session_supplement(
                base_litres, parliament_session, params
            )
            
            # Calculate total before caps
            total_before_caps = base_litres + session_litres
            
            # Apply caps and floors
            final_litres = self._apply_caps_and_floors(total_before_caps, params)
            
            # Calculate final USD value
            final_value_usd = final_litres * fuel_price_usd
            
            return {
                'success': True,
                'calculation_breakdown': {
                    'distance_km': distance_km,
                    'engine_capacity_cc': engine_capacity_cc,
                    'engine_constant': float(engine_constant),
                    'distance_factor': float(distance_factor),
                    'fuel_price_usd': float(fuel_price_usd),
                    'aa_usd': float(aa_usd),
                    'base_litres': float(base_litres),
                    'session_litres': float(session_litres),
                    'total_before_caps': float(total_before_caps),
                    'final_litres': float(final_litres),
                    'final_value_usd': float(final_value_usd),
                },
                'allocation_result': {
                    'base_allocation_litres': float(base_litres),
                    'session_supplement_litres': float(session_litres),
                    'total_allocation_litres': float(final_litres),
                    'allocated_value_usd': float(final_value_usd),
                },
                'metadata': {
                    'calculation_date': timezone.now().isoformat(),
                    'engine_band': self._get_engine_band(engine_capacity_cc),
                    'rule_source': self.rule.rule_name if self.rule else 'DEFAULT',
                    'parliament_session': parliament_session.title if parliament_session else None,
                }
            }
            
        except Exception as e:
            logger.error(f"Allocation calculation error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'calculation_breakdown': {},
                'allocation_result': {
                    'base_allocation_litres': 0,
                    'session_supplement_litres': 0,
                    'total_allocation_litres': 0,
                    'allocated_value_usd': 0,
                }
            }
    
    def _get_calculation_parameters(self, custom_parameters: Optional[Dict] = None) -> Dict:
        """Get calculation parameters from rule or defaults"""
        if self.rule:
            return {
                'engine_constants': {
                    'UNDER_2800': self.rule.engine_constant_under_2800,
                    '2800_TO_3199': self.rule.engine_constant_2800_3199,
                    '3200_AND_ABOVE': self.rule.engine_constant_3200_plus,
                },
                'distance_base': self.rule.distance_factor_base,
                'distance_per_km': self.rule.distance_factor_per_km,
                'max_distance_factor': self.rule.max_distance_factor,
                'min_allocation': self.rule.minimum_allocation_litres,
                'max_allocation': self.rule.maximum_allocation_litres,
                'session_top_up_litres': self.rule.session_top_up_litres,
                'session_top_up_percentage': self.rule.session_top_up_percentage,
            }
        
        # Use defaults with custom overrides
        params = {
            'engine_constants': self.DEFAULT_ENGINE_CONSTANTS.copy(),
            'distance_base': self.DEFAULT_DISTANCE_BASE,
            'distance_per_km': self.DEFAULT_DISTANCE_PER_KM,
            'max_distance_factor': self.DEFAULT_MAX_DISTANCE_FACTOR,
            'min_allocation': self.DEFAULT_MIN_ALLOCATION,
            'max_allocation': self.DEFAULT_MAX_ALLOCATION,
            'session_top_up_litres': Decimal('0'),
            'session_top_up_percentage': Decimal('0'),
        }
        
        if custom_parameters:
            params.update(custom_parameters)
        
        return params
    
    def _get_engine_constant(self, engine_capacity_cc: int, params: Dict) -> Decimal:
        """Get engine constant based on capacity band"""
        if engine_capacity_cc < 2800:
            return params['engine_constants']['UNDER_2800']
        elif 2800 <= engine_capacity_cc <= 3199:
            return params['engine_constants']['2800_TO_3199']
        else:
            return params['engine_constants']['3200_AND_ABOVE']
    
    def _get_engine_band(self, engine_capacity_cc: int) -> str:
        """Get engine band name for metadata"""
        if engine_capacity_cc < 2800:
            return 'UNDER_2800'
        elif 2800 <= engine_capacity_cc <= 3199:
            return '2800_TO_3199'
        else:
            return '3200_AND_ABOVE'
    
    def _calculate_distance_factor(self, distance_km: int, params: Dict) -> Decimal:
        """Calculate distance factor with cap"""
        factor = params['distance_base'] + (distance_km * params['distance_per_km'])
        return min(factor, params['max_distance_factor'])
    
    def _calculate_session_supplement(
        self, 
        base_litres: Decimal, 
        parliament_session, 
        params: Dict
    ) -> Decimal:
        """Calculate session-based supplements"""
        session_litres = Decimal('0')
        
        # Check parliament session specific top-up
        if parliament_session:
            if hasattr(parliament_session, 'fuel_top_up_litres') and parliament_session.fuel_top_up_litres:
                session_litres += parliament_session.fuel_top_up_litres
            elif hasattr(parliament_session, 'fuel_top_up_percentage') and parliament_session.fuel_top_up_percentage:
                session_litres += base_litres * (parliament_session.fuel_top_up_percentage / 100)
        
        # Apply rule-based top-ups
        if params['session_top_up_litres'] > 0:
            session_litres += params['session_top_up_litres']
        
        if params['session_top_up_percentage'] > 0:
            session_litres += base_litres * (params['session_top_up_percentage'] / 100)
        
        return session_litres
    
    def _apply_caps_and_floors(self, total_litres: Decimal, params: Dict) -> Decimal:
        """Apply minimum and maximum allocation limits"""
        return max(
            params['min_allocation'],
            min(total_litres, params['max_allocation'])
        )


class AllocationPreviewManager:
    """
    Manages allocation preview generation and batch operations.
    Provides preview/commit workflow functionality.
    """
    
    def __init__(self):
        self.calculation_engine = AllocationCalculationEngine()
    
    def generate_preview_for_beneficiary(
        self,
        beneficiary,
        rule,
        period_start: date,
        period_end: date,
        parliament_session=None,
        fuel_price=None
    ) -> Dict[str, Any]:
        """Generate allocation preview for single beneficiary"""
        from ..models import FuelPrice, DynamicAllocation
        
        try:
            # Get beneficiary profile
            profile = self._get_beneficiary_profile(beneficiary)
            
            # Get fuel price
            if not fuel_price:
                fuel_price = FuelPrice.get_current_price(
                    fuel_type=getattr(profile, 'fuel_type', 'DIESEL'),
                    date=period_start
                )
                if not fuel_price:
                    return {
                        'success': False,
                        'error': 'No fuel price available for calculation'
                    }
            
            # Get calculation inputs
            distance_km = getattr(profile, 'distance_from_parliament_km', 0)
            if not distance_km and profile.constituency:
                distance_km = profile.constituency.distance_from_parliament_km
            
            engine_capacity_cc = getattr(profile, 'engine_capacity_cc', None)
            if not engine_capacity_cc:
                engine_capacity_cc = self._extract_engine_capacity(profile)
            
            # Set calculation engine rule
            self.calculation_engine.rule = rule
            
            # Calculate allocation
            calculation_result = self.calculation_engine.calculate_allocation(
                beneficiary_profile=profile,
                distance_km=distance_km,
                engine_capacity_cc=engine_capacity_cc,
                fuel_price_usd=fuel_price.price_per_litre_usd,
                parliament_session=parliament_session
            )
            
            if not calculation_result['success']:
                return calculation_result
            
            # Create preview allocation (unsaved)
            allocation = DynamicAllocation(
                beneficiary=beneficiary,
                rule_applied=rule,
                parliament_session=parliament_session,
                fuel_price=fuel_price,
                allocation_period_start=period_start,
                allocation_period_end=period_end,
                period_type=rule.period_type,
                base_allocation_litres=Decimal(str(calculation_result['allocation_result']['base_allocation_litres'])),
                session_supplement_litres=Decimal(str(calculation_result['allocation_result']['session_supplement_litres'])),
                total_allocation_litres=Decimal(str(calculation_result['allocation_result']['total_allocation_litres'])),
                allocated_value_usd=Decimal(str(calculation_result['allocation_result']['allocated_value_usd'])),
                calculation_details=calculation_result,
                engine_capacity_cc=engine_capacity_cc,
                distance_from_parliament_km=distance_km,
                engine_constant_applied=Decimal(str(calculation_result['calculation_breakdown']['engine_constant'])),
                distance_factor_applied=Decimal(str(calculation_result['calculation_breakdown']['distance_factor'])),
                fuel_price_used=fuel_price.price_per_litre_usd,
                status='PREVIEW',
            )
            
            return {
                'success': True,
                'allocation_preview': allocation,
                'calculation_result': calculation_result,
                'beneficiary_summary': {
                    'name': beneficiary.get_full_name(),
                    'category': profile.category.name if hasattr(profile, 'category') else 'Unknown',
                    'constituency': profile.constituency.name if hasattr(profile, 'constituency') and profile.constituency else 'Unknown',
                    'vehicle_info': self._get_vehicle_summary(profile),
                }
            }
            
        except Exception as e:
            logger.error(f"Preview generation error for {beneficiary.username}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_bulk_preview(
        self,
        beneficiaries: List,
        rule,
        period_start: date,
        period_end: date,
        parliament_session=None,
        fuel_price=None
    ) -> Dict[str, Any]:
        """Generate allocation previews for multiple beneficiaries"""
        results = {
            'success': True,
            'total_beneficiaries': len(beneficiaries),
            'successful_previews': 0,
            'failed_previews': 0,
            'previews': [],
            'errors': [],
            'summary': {
                'total_litres': Decimal('0'),
                'total_value_usd': Decimal('0'),
                'average_allocation': Decimal('0'),
            }
        }
        
        for beneficiary in beneficiaries:
            preview_result = self.generate_preview_for_beneficiary(
                beneficiary=beneficiary,
                rule=rule,
                period_start=period_start,
                period_end=period_end,
                parliament_session=parliament_session,
                fuel_price=fuel_price
            )
            
            if preview_result['success']:
                allocation = preview_result['allocation_preview']
                results['previews'].append({
                    'beneficiary_id': beneficiary.id,
                    'beneficiary_name': beneficiary.get_full_name(),
                    'allocation_preview': allocation,
                    'calculation_result': preview_result['calculation_result'],
                })
                results['successful_previews'] += 1
                results['summary']['total_litres'] += allocation.total_allocation_litres
                results['summary']['total_value_usd'] += allocation.allocated_value_usd
            else:
                results['failed_previews'] += 1
                results['errors'].append({
                    'beneficiary_id': beneficiary.id,
                    'beneficiary_name': beneficiary.get_full_name(),
                    'error': preview_result['error']
                })
        
        # Calculate averages
        if results['successful_previews'] > 0:
            results['summary']['average_allocation'] = results['summary']['total_litres'] / results['successful_previews']
        
        return results
    
    def commit_preview(self, allocation_preview, committed_by_user) -> Dict[str, Any]:
        """Commit a preview allocation to the database"""
        from ..models import AuditLog
        
        try:
            with transaction.atomic():
                # Save the allocation
                allocation_preview.committed_by = committed_by_user
                allocation_preview.committed_at = timezone.now()
                allocation_preview.status = 'COMMITTED'
                allocation_preview.save()
                
                # Create audit log
                AuditLog.log(
                    action='ALLOCATE',
                    user=committed_by_user,
                    content_object=allocation_preview,
                    description=f"Dynamic allocation committed: {allocation_preview.total_allocation_litres}L to {allocation_preview.beneficiary.get_full_name()}",
                    changes={'status': 'PREVIEW -> COMMITTED'},
                    severity='MEDIUM'
                )
                
                return {
                    'success': True,
                    'allocation': allocation_preview,
                    'message': 'Allocation successfully committed'
                }
        
        except Exception as e:
            logger.error(f"Error committing allocation {allocation_preview.allocation_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def commit_bulk_previews(self, allocation_previews: List, committed_by_user) -> Dict[str, Any]:
        """Commit multiple preview allocations"""
        results = {
            'success': True,
            'total_allocations': len(allocation_previews),
            'committed_count': 0,
            'failed_count': 0,
            'committed_allocations': [],
            'errors': []
        }
        
        for allocation in allocation_previews:
            commit_result = self.commit_preview(allocation, committed_by_user)
            
            if commit_result['success']:
                results['committed_count'] += 1
                results['committed_allocations'].append(commit_result['allocation'])
            else:
                results['failed_count'] += 1
                results['errors'].append({
                    'allocation_id': allocation.allocation_id,
                    'beneficiary': allocation.beneficiary.get_full_name(),
                    'error': commit_result['error']
                })
        
        return results
    
    def _get_beneficiary_profile(self, beneficiary):
        """Get beneficiary profile (handles both profile types)"""
        if hasattr(beneficiary, 'harmonized_beneficiary_profile'):
            return beneficiary.harmonized_beneficiary_profile
        elif hasattr(beneficiary, 'beneficiary_profile'):
            return beneficiary.beneficiary_profile
        else:
            raise ValueError(f"Beneficiary {beneficiary.username} has no profile")
    
    def _extract_engine_capacity(self, profile) -> int:
        """Extract engine capacity from profile data"""
        # Try explicit field first
        if hasattr(profile, 'engine_capacity_cc') and profile.engine_capacity_cc:
            return profile.engine_capacity_cc
        
        # Try to extract from engine_size string
        if hasattr(profile, 'engine_size') and profile.engine_size:
            import re
            pattern = r'(\d+\.?\d*)\s*(?:L|cc|litre|liter)'
            match = re.search(pattern, profile.engine_size, re.IGNORECASE)
            if match:
                size = float(match.group(1))
                if 'L' in profile.engine_size or 'litre' in profile.engine_size.lower():
                    return int(size * 1000)  # Convert litres to CC
                else:
                    return int(size)  # Already in CC
        
        # Default fallback
        return 2500  # Conservative mid-range estimate
    
    def _get_vehicle_summary(self, profile) -> Dict:
        """Get vehicle information summary"""
        return {
            'make': getattr(profile, 'vehicle_make', ''),
            'model': getattr(profile, 'vehicle_model', ''),
            'year': getattr(profile, 'vehicle_year', None),
            'engine_size': getattr(profile, 'engine_size', ''),
            'registration': getattr(profile, 'vehicle_registration', ''),
            'fuel_type': getattr(profile, 'fuel_type', 'DIESEL'),
        }


class AllocationRuleManager:
    """
    Manages allocation rules and their application logic.
    Handles rule selection, validation, and execution.
    """
    
    def get_applicable_rules(
        self,
        beneficiary_profile,
        date: Optional[date] = None
    ) -> List:
        """Get all rules applicable to a beneficiary on a given date"""
        from ..models import FuelAllocationRule
        
        if date is None:
            date = timezone.now().date()
        
        # Get all active rules effective on the date
        rules = FuelAllocationRule.objects.filter(
            is_active=True,
            effective_from__lte=date
        ).filter(
            Q(effective_until__isnull=True) | Q(effective_until__gte=date)
        )
        
        # Filter rules that apply to this beneficiary
        applicable_rules = []
        for rule in rules:
            if rule.applies_to_beneficiary(beneficiary_profile):
                applicable_rules.append(rule)
        
        # Sort by priority
        applicable_rules.sort(key=lambda r: r.priority)
        
        return applicable_rules
    
    def get_best_rule(
        self,
        beneficiary_profile,
        allocation_type: str = 'REGULAR',
        date: Optional[date] = None
    ):
        """Get the best (highest priority) rule for a beneficiary"""
        applicable_rules = self.get_applicable_rules(beneficiary_profile, date)
        
        # Filter by allocation type if specified
        if allocation_type != 'REGULAR':
            type_specific_rules = [
                rule for rule in applicable_rules 
                if rule.rule_type.endswith(allocation_type.upper())
            ]
            if type_specific_rules:
                return type_specific_rules[0]
        
        # Return highest priority rule
        return applicable_rules[0] if applicable_rules else None
    
    def validate_rule_application(
        self,
        rule,
        beneficiary_profile,
        period_start: date,
        period_end: date
    ) -> Dict[str, Any]:
        """Validate if a rule can be applied to a beneficiary for a period"""
        validation_result = {
            'valid': True,
            'warnings': [],
            'errors': []
        }
        
        # Check if rule is active and effective
        if not rule.is_active:
            validation_result['valid'] = False
            validation_result['errors'].append('Rule is not active')
        
        if not rule.is_effective_on_date(period_start):
            validation_result['valid'] = False
            validation_result['errors'].append(f'Rule not effective on {period_start}')
        
        # Check if rule applies to beneficiary
        if not rule.applies_to_beneficiary(beneficiary_profile):
            validation_result['valid'] = False
            validation_result['errors'].append('Rule does not apply to this beneficiary')
        
        # Check for existing allocations in period
        from ..models import DynamicAllocation
        existing_allocations = DynamicAllocation.objects.filter(
            beneficiary=beneficiary_profile.user,
            allocation_period_start__lte=period_end,
            allocation_period_end__gte=period_start,
            status__in=['COMMITTED', 'PARTIALLY_FULFILLED', 'FULFILLED']
        )
        
        if existing_allocations.exists():
            validation_result['warnings'].append(
                f'Beneficiary has {existing_allocations.count()} existing allocations in this period'
            )
        
        return validation_result


class AllocationAnalytics:
    """
    Analytics and reporting for dynamic allocations.
    Provides insights, trends, and performance metrics.
    """
    
    def get_allocation_summary(
        self,
        start_date: date,
        end_date: date,
        beneficiary_filter: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Get comprehensive allocation summary for a period"""
        from ..models import DynamicAllocation
        
        # Base queryset
        allocations = DynamicAllocation.objects.filter(
            allocation_period_start__gte=start_date,
            allocation_period_end__lte=end_date,
            status__in=['COMMITTED', 'PARTIALLY_FULFILLED', 'FULFILLED']
        )
        
        # Apply beneficiary filters if provided
        if beneficiary_filter:
            if 'category' in beneficiary_filter:
                allocations = allocations.filter(
                    beneficiary__beneficiary_profile__category__name=beneficiary_filter['category']
                )
            if 'constituency' in beneficiary_filter:
                allocations = allocations.filter(
                    beneficiary__beneficiary_profile__constituency__name=beneficiary_filter['constituency']
                )
        
        # Calculate summary statistics
        summary = allocations.aggregate(
            total_allocations=Count('id'),
            total_litres=Sum('total_allocation_litres'),
            total_value_usd=Sum('allocated_value_usd'),
            average_allocation=Avg('total_allocation_litres'),
            total_fulfilled_litres=Sum('litres_fulfilled')
        )
        
        # Calculate additional metrics
        fulfillment_rate = 0
        if summary['total_litres']:
            fulfillment_rate = (summary['total_fulfilled_litres'] or 0) / summary['total_litres'] * 100
        
        # Get breakdown by categories
        category_breakdown = allocations.values(
            'beneficiary__beneficiary_profile__category__name'
        ).annotate(
            count=Count('id'),
            total_litres=Sum('total_allocation_litres'),
            avg_litres=Avg('total_allocation_litres')
        )
        
        # Get breakdown by engine bands (avoid deprecated .extra)
        from django.db.models import Case, When, Value, CharField
        engine_band_expr = Case(
            When(engine_capacity_cc__lt=2800, then=Value('Under 2800cc')),
            When(engine_capacity_cc__gte=2800, engine_capacity_cc__lte=3199, then=Value('2800-3199cc')),
            default=Value('3200cc and above'),
            output_field=CharField()
        )
        engine_breakdown = allocations.annotate(
            engine_band=engine_band_expr
        ).values('engine_band').annotate(
            count=Count('id'),
            total_litres=Sum('total_allocation_litres'),
            avg_litres=Avg('total_allocation_litres')
        )
        
        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'summary': {
                'total_allocations': summary['total_allocations'] or 0,
                'total_litres': float(summary['total_litres'] or 0),
                'total_value_usd': float(summary['total_value_usd'] or 0),
                'average_allocation': float(summary['average_allocation'] or 0),
                'fulfillment_rate': round(fulfillment_rate, 2),
            },
            'breakdowns': {
                'by_category': list(category_breakdown),
                'by_engine_band': list(engine_breakdown),
            }
        }
    
    def get_beneficiary_allocation_history(
        self,
        beneficiary,
        months_back: int = 12
    ) -> Dict[str, Any]:
        """Get allocation history for a specific beneficiary"""
        from ..models import DynamicAllocation
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=months_back * 30)
        
        allocations = DynamicAllocation.objects.filter(
            beneficiary=beneficiary,
            allocation_period_start__gte=start_date
        ).order_by('-allocation_period_start')
        
        history = []
        for allocation in allocations:
            history.append({
                'allocation_id': allocation.allocation_id,
                'period_start': allocation.allocation_period_start.isoformat(),
                'period_end': allocation.allocation_period_end.isoformat(),
                'total_litres': float(allocation.total_allocation_litres),
                'fulfilled_litres': float(allocation.litres_fulfilled),
                'status': allocation.status,
                'rule_applied': allocation.rule_applied.rule_name,
                'value_usd': float(allocation.allocated_value_usd),
            })
        
        # Calculate trends
        total_litres = sum(h['total_litres'] for h in history)
        avg_monthly = total_litres / max(months_back, 1)
        
        return {
            'beneficiary': {
                'name': beneficiary.get_full_name(),
                'id': beneficiary.id,
            },
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'months': months_back,
            },
            'summary': {
                'total_allocations': len(history),
                'total_litres': total_litres,
                'average_monthly': round(avg_monthly, 2),
            },
            'history': history
        }
