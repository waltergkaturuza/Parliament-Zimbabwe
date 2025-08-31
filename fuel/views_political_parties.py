# fuel/views_political_parties.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone

from .models_political_parties import PoliticalParty
from .serializers_political_parties import (
    PoliticalPartySerializer,
    PoliticalPartyListSerializer,
    PoliticalPartyCreateSerializer,
    PoliticalPartyStatsSerializer
)


class PoliticalPartyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing political parties
    """
    queryset = PoliticalParty.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return PoliticalPartyCreateSerializer
        elif self.action == 'list':
            return PoliticalPartyListSerializer
        elif self.action in ['active_parties', 'parliamentary_parties']:
            return PoliticalPartyListSerializer
        return PoliticalPartySerializer
    
    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = PoliticalParty.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by party type
        party_type = self.request.query_params.get('party_type', None)
        if party_type:
            queryset = queryset.filter(party_type=party_type)
        
        # Filter by parliamentary representation
        parliamentary = self.request.query_params.get('parliamentary', None)
        if parliamentary is not None:
            is_parliamentary = parliamentary.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_parliamentary_party=is_parliamentary)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(short_name__icontains=search) |
                Q(abbreviation__icontains=search) |
                Q(leader_name__icontains=search)
            )
        
        return queryset.order_by('display_order', 'name')
    
    def create(self, request, *args, **kwargs):
        """Create a new political party"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set created_by if user is authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            party = serializer.save()
        else:
            party = serializer.save()
        
        # Return full serializer data
        return_serializer = PoliticalPartySerializer(party)
        return Response(return_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update political party"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = PoliticalPartyCreateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        party = serializer.save()
        
        # Return full serializer data
        return_serializer = PoliticalPartySerializer(party)
        return Response(return_serializer.data)
    
    @action(detail=False, methods=['get'])
    def active_parties(self, request):
        """Get all active political parties"""
        active_parties = PoliticalParty.get_active_parties()
        serializer = self.get_serializer(active_parties, many=True)
        return Response({
            'count': active_parties.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def parliamentary_parties(self, request):
        """Get all parliamentary parties for dropdowns"""
        parliamentary_parties = PoliticalParty.objects.filter(
            is_parliamentary_party=True,
            status='ACTIVE'
        ).order_by('display_order', 'name')
        
        serializer = self.get_serializer(parliamentary_parties, many=True)
        return Response({
            'count': parliamentary_parties.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get political party statistics"""
        total_parties = PoliticalParty.objects.count()
        active_parties = PoliticalParty.objects.filter(status='ACTIVE').count()
        parliamentary_parties = PoliticalParty.objects.filter(
            is_parliamentary_party=True,
            status='ACTIVE'
        ).count()
        
        # Get government party
        government_party = PoliticalParty.objects.filter(
            is_government_party=True,
            status='ACTIVE'
        ).first()
        
        # Count total members across all parties
        total_members = 0
        party_breakdown = []
        
        for party in PoliticalParty.objects.filter(status='ACTIVE'):
            member_count = party.member_count
            total_members += member_count
            
            party_breakdown.append({
                'id': party.id,
                'name': party.name,
                'short_name': party.short_name,
                'member_count': member_count,
                'is_government_party': party.is_government_party,
                'primary_color': party.primary_color
            })
        
        # Sort by member count descending
        party_breakdown.sort(key=lambda x: x['member_count'], reverse=True)
        
        stats_data = {
            'total_parties': total_parties,
            'active_parties': active_parties,
            'parliamentary_parties': parliamentary_parties,
            'government_party': government_party.name if government_party else 'None',
            'total_members': total_members,
            'party_breakdown': party_breakdown
        }
        
        serializer = PoliticalPartyStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def seed_default_parties(self, request):
        """Seed the database with default Zimbabwe political parties"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff users can seed default parties'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        created_count = PoliticalParty.seed_default_parties()
        
        return Response({
            'message': f'Successfully seeded {created_count} political parties',
            'created_count': created_count
        })
    
    @action(detail=True, methods=['post'])
    def set_as_government_party(self, request, pk=None):
        """Set a party as the government party"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff users can set government party'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        party = self.get_object()
        
        # Remove government party status from all other parties
        PoliticalParty.objects.filter(is_government_party=True).update(
            is_government_party=False
        )
        
        # Set this party as government party
        party.is_government_party = True
        party.save()
        
        serializer = self.get_serializer(party)
        return Response({
            'message': f'{party.name} has been set as the government party',
            'party': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all beneficiaries belonging to this party"""
        party = self.get_object()
        
        # Import here to avoid circular imports
        from .models import BeneficiaryProfile
        from .serializers import BeneficiaryProfileSerializer
        
        members = BeneficiaryProfile.objects.filter(
            political_party=party,
            is_active_beneficiary=True
        ).select_related('user', 'category', 'constituency')
        
        # Use pagination if available
        page = self.paginate_queryset(members)
        if page is not None:
            serializer = BeneficiaryProfileSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = BeneficiaryProfileSerializer(members, many=True)
        return Response({
            'count': members.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def choices(self, request):
        """Get political party choices for form dropdowns"""
        choices_type = request.query_params.get('type', 'all')
        
        if choices_type == 'parliamentary':
            queryset = PoliticalParty.objects.filter(
                is_parliamentary_party=True,
                status='ACTIVE'
            )
        elif choices_type == 'active':
            queryset = PoliticalParty.objects.filter(status='ACTIVE')
        else:
            queryset = PoliticalParty.objects.all()
        
        queryset = queryset.order_by('display_order', 'name')
        
        choices = []
        for party in queryset:
            choices.append({
                'value': party.id,
                'label': party.display_name,
                'short_name': party.short_name,
                'color': party.primary_color,
                'is_government': party.is_government_party
            })
        
        return Response({
            'choices': choices,
            'count': len(choices)
        })
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete political party (set status to DISBANDED)"""
        party = self.get_object()
        
        # Check if party has active members
        if party.member_count > 0:
            return Response(
                {'error': f'Cannot delete party with {party.member_count} active members. Please reassign members first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set status to disbanded instead of hard delete
        party.status = 'DISBANDED'
        party.save()
        
        return Response({
            'message': f'{party.name} has been disbanded',
            'id': party.id
        }, status=status.HTTP_200_OK)
