from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from fuel.models import BeneficiaryProfile, BeneficiaryCategory
import json

User = get_user_model()


class Command(BaseCommand):
    help = 'Debug beneficiary data for troubleshooting API issues'

    def handle(self, *args, **options):
        self.stdout.write("=== Beneficiary Data Debug Report ===\n")
        
        # 1. Check Users
        all_users = User.objects.all()
        beneficiary_users = User.objects.filter(role='BENEFICIARY')
        
        self.stdout.write(f"👥 USERS:")
        self.stdout.write(f"  Total users: {all_users.count()}")
        self.stdout.write(f"  Beneficiary users: {beneficiary_users.count()}")
        
        if beneficiary_users.exists():
            self.stdout.write(f"  Sample beneficiary users:")
            for user in beneficiary_users[:3]:
                self.stdout.write(f"    - {user.username} ({user.email}) - {user.first_name} {user.last_name}")
        
        # 2. Check BeneficiaryProfiles
        all_profiles = BeneficiaryProfile.objects.all()
        active_profiles = BeneficiaryProfile.objects.filter(is_active_beneficiary=True)
        
        self.stdout.write(f"\n📋 BENEFICIARY PROFILES:")
        self.stdout.write(f"  Total profiles: {all_profiles.count()}")
        self.stdout.write(f"  Active profiles: {active_profiles.count()}")
        
        if all_profiles.exists():
            self.stdout.write(f"  Sample profiles:")
            for profile in all_profiles[:3]:
                user_info = f"{profile.user.username}" if profile.user else "No User"
                self.stdout.write(f"    - {profile.first_name} {profile.last_name} ({user_info}) - Active: {profile.is_active_beneficiary}")
        
        # 3. Check Categories
        categories = BeneficiaryCategory.objects.all()
        self.stdout.write(f"\n🏷️  CATEGORIES:")
        self.stdout.write(f"  Total categories: {categories.count()}")
        
        # 4. Check API Response Structure
        if active_profiles.exists():
            from fuel.serializers import BeneficiaryProfileSerializer
            sample_profile = active_profiles.first()
            serializer = BeneficiaryProfileSerializer(sample_profile)
            
            self.stdout.write(f"\n🔍 SAMPLE API RESPONSE:")
            self.stdout.write(f"  Profile ID: {sample_profile.id}")
            self.stdout.write(f"  User: {sample_profile.user.username if sample_profile.user else 'None'}")
            self.stdout.write(f"  Name: {sample_profile.first_name} {sample_profile.last_name}")
            self.stdout.write(f"  Status: {sample_profile.status if hasattr(sample_profile, 'status') else 'No status field'}")
            self.stdout.write(f"  Is Active: {sample_profile.is_active_beneficiary}")
            
            # Check key serializer fields
            data = serializer.data
            self.stdout.write(f"  Serialized fields present:")
            required_fields = ['id', 'name', 'email', 'phoneNumber', 'status', 'category']
            for field in required_fields:
                value = data.get(field, 'MISSING')
                self.stdout.write(f"    {field}: {value}")
        
        # 5. Users without profiles
        users_without_profiles = beneficiary_users.exclude(
            id__in=all_profiles.values_list('user_id', flat=True)
        )
        
        self.stdout.write(f"\n⚠️  MISSING PROFILES:")
        self.stdout.write(f"  Users without profiles: {users_without_profiles.count()}")
        
        if users_without_profiles.exists():
            self.stdout.write(f"  Users needing profiles:")
            for user in users_without_profiles[:5]:
                self.stdout.write(f"    - {user.username} ({user.email})")
            if users_without_profiles.count() > 5:
                self.stdout.write(f"    ... and {users_without_profiles.count() - 5} more")
        
        # 6. Recommendations
        self.stdout.write(f"\n💡 RECOMMENDATIONS:")
        
        if beneficiary_users.exists() and not all_profiles.exists():
            self.stdout.write("  ❌ No BeneficiaryProfile records found!")
            self.stdout.write("  🔧 Run: python manage.py create_beneficiary_profiles")
        elif users_without_profiles.exists():
            self.stdout.write(f"  ⚠️  {users_without_profiles.count()} users missing profiles")
            self.stdout.write("  🔧 Run: python manage.py create_beneficiary_profiles")
        elif active_profiles.exists():
            self.stdout.write("  ✅ BeneficiaryProfiles exist and should be visible in API")
            self.stdout.write("  🔍 Check frontend API call: /api/beneficiaries/")
        else:
            self.stdout.write("  ❓ Check if profiles exist but are inactive")
        
        self.stdout.write(f"\n=== End Debug Report ===")
