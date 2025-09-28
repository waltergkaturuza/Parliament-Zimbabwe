#!/usr/bin/env python
import os
import sys
import django

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, SubCenter, BeneficiaryProfile

print("=== SUBCENTER USERS ===")
users = User.objects.filter(role='SUB_CENTER')
print(f"Found {users.count()} subcenter users:")
for u in users:
    sub_center = getattr(u, 'sub_center', None)
    print(f"- {u.username} (ID: {u.id}) -> SubCenter: {sub_center}")

print("\n=== SUBCENTERS ===")
centers = SubCenter.objects.all()
print(f"Found {centers.count()} subcenters:")
for c in centers:
    print(f"- {c.name} (ID: {c.id})")

print("\n=== BENEFICIARIES (first 5) ===")
beneficiaries = BeneficiaryProfile.objects.all()[:5]
print(f"Found {BeneficiaryProfile.objects.count()} total beneficiaries, showing first 5:")
for b in beneficiaries:
    print(f"- {b.user.username} -> SubCenter: {b.sub_center}")

print("\n=== TESTING USER: subcenter ===")
try:
    test_user = User.objects.get(username='subcenter')
    print(f"User: {test_user.username}")
    print(f"Role: {test_user.role}")
    print(f"SubCenter: {getattr(test_user, 'sub_center', 'None')}")
    print(f"Has sub_center attr: {hasattr(test_user, 'sub_center')}")
    if hasattr(test_user, 'sub_center') and test_user.sub_center:
        print(f"SubCenter ID: {test_user.sub_center.id}")
        print(f"SubCenter Name: {test_user.sub_center.name}")
        # Check beneficiaries for this subcenter
        beneficiaries_for_subcenter = BeneficiaryProfile.objects.filter(sub_center=test_user.sub_center)
        print(f"Beneficiaries for this subcenter: {beneficiaries_for_subcenter.count()}")
except User.DoesNotExist:
    print("User 'subcenter' not found")