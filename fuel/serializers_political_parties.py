# fuel/serializers_political_parties.py
from rest_framework import serializers
from .models_political_parties import PoliticalParty

class PoliticalPartySerializer(serializers.ModelSerializer):
    """Serializer for Political Party model"""
    
    display_name = serializers.ReadOnlyField()
    member_count = serializers.ReadOnlyField()
    
    class Meta:
        model = PoliticalParty
        fields = [
            'id', 'name', 'short_name', 'abbreviation', 'party_type', 'status',
            'headquarters_address', 'contact_phone', 'contact_email', 'website',
            'leader_name', 'leader_title', 'founded_date', 'description',
            'is_government_party', 'is_parliamentary_party', 'display_order',
            'primary_color', 'secondary_color', 'created_at', 'updated_at',
            'display_name', 'member_count'
        ]
        read_only_fields = ['created_at', 'updated_at', 'display_name', 'member_count']
    
    def validate_short_name(self, value):
        """Ensure short name is uppercase and unique"""
        value = value.upper().strip()
        
        # Check uniqueness excluding current instance
        queryset = PoliticalParty.objects.filter(short_name=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("A party with this short name already exists.")
        
        return value
    
    def validate_primary_color(self, value):
        """Validate hex color format"""
        if value and not value.startswith('#'):
            value = f"#{value}"
        
        if value and len(value) != 7:
            raise serializers.ValidationError("Color must be in hex format (#FFFFFF)")
        
        return value
    
    def validate_secondary_color(self, value):
        """Validate hex color format"""
        if value and not value.startswith('#'):
            value = f"#{value}"
        
        if value and len(value) != 7:
            raise serializers.ValidationError("Color must be in hex format (#FFFFFF)")
        
        return value


class PoliticalPartyListSerializer(serializers.ModelSerializer):
    """Simplified serializer for dropdown lists"""
    
    display_name = serializers.ReadOnlyField()
    member_count = serializers.ReadOnlyField()
    
    class Meta:
        model = PoliticalParty
        fields = [
            'id', 'name', 'short_name', 'status', 'is_parliamentary_party',
            'display_order', 'primary_color', 'display_name', 'member_count'
        ]


class PoliticalPartyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating political parties"""
    
    class Meta:
        model = PoliticalParty
        fields = [
            'name', 'short_name', 'abbreviation', 'party_type', 'status',
            'headquarters_address', 'contact_phone', 'contact_email', 'website',
            'leader_name', 'leader_title', 'founded_date', 'description',
            'is_government_party', 'is_parliamentary_party', 'display_order',
            'primary_color', 'secondary_color'
        ]
    
    def validate(self, data):
        """Cross-field validation"""
        # Ensure only one government party
        if data.get('is_government_party', False):
            existing_gov_party = PoliticalParty.objects.filter(
                is_government_party=True,
                status='ACTIVE'
            )
            if self.instance:
                existing_gov_party = existing_gov_party.exclude(pk=self.instance.pk)
            
            if existing_gov_party.exists():
                raise serializers.ValidationError({
                    'is_government_party': 'Only one party can be marked as the government party'
                })
        
        return data
    
    def create(self, validated_data):
        """Create political party with automatic short_name generation"""
        if not validated_data.get('short_name') and validated_data.get('name'):
            # Auto-generate short name
            words = validated_data['name'].upper().split()
            if len(words) > 1:
                short_name = ''.join([word[0] for word in words if len(word) > 2])
            else:
                short_name = words[0][:10]
            validated_data['short_name'] = short_name
        
        return super().create(validated_data)


class PoliticalPartyStatsSerializer(serializers.Serializer):
    """Serializer for political party statistics"""
    
    total_parties = serializers.IntegerField()
    active_parties = serializers.IntegerField()
    parliamentary_parties = serializers.IntegerField()
    government_party = serializers.CharField()
    total_members = serializers.IntegerField()
    party_breakdown = serializers.ListField(
        child=serializers.DictField()
    )
    
    class Meta:
        fields = [
            'total_parties', 'active_parties', 'parliamentary_parties',
            'government_party', 'total_members', 'party_breakdown'
        ]
