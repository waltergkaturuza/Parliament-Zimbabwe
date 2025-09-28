import os
import sys
import django

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, BeneficiaryProfile, SubCenter

print(f"Total users: {User.objects.count()}")
print(f"Total subcenter users: {User.objects.filter(role__in=['SUB_CENTER', 'SUB_CENTER_APPROVER']).count()}")
print(f"Subcenter users with sub_center assigned: {User.objects.filter(role__in=['SUB_CENTER', 'SUB_CENTER_APPROVER'], sub_center__isnull=False).count()}")
print(f"Total beneficiaries: {BeneficiaryProfile.objects.count()}")
print(f"Beneficiaries with sub_center assigned: {BeneficiaryProfile.objects.filter(sub_center__isnull=False).count()}")

# Show some examples
print("\nSubcenter users:")
for user in User.objects.filter(role__in=['SUB_CENTER', 'SUB_CENTER_APPROVER'])[:3]:
    print(f"- {user.username} (Role: {user.role}, Sub-center: {user.sub_center})")

print("\nBeneficiaries with subcenters:")
for beneficiary in BeneficiaryProfile.objects.filter(sub_center__isnull=False)[:5]:
    print(f"- {beneficiary.user.first_name} {beneficiary.user.last_name} -> {beneficiary.sub_center.name}")