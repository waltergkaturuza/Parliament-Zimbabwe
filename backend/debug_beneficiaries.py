import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parliament_fuel_system.settings')
django.setup()

from fuel.models import BeneficiaryProfile
from fuel.serializers import BeneficiaryProfileSerializer
from fuel.models import FuelDispatch

print("=== CHECKING BENEFICIARIES ===")
beneficiaries = BeneficiaryProfile.objects.select_related('user', 'constituency', 'category').all()[:3]

for b in beneficiaries:
    print(f"ID: {b.id}")
    if b.user:
        print(f"  User: {b.user.first_name} {b.user.last_name} ({b.user.username})")
    print(f"  Constituency: {b.constituency.name if b.constituency else 'None'}")
    print("---")

print("\n=== CHECKING SERIALIZED DATA ===")
serializer = BeneficiaryProfileSerializer(beneficiaries, many=True)
for i, data in enumerate(serializer.data[:3]):
    print(f"Beneficiary {i+1}:")
    print(f"  id: {data.get('id')}")
    print(f"  name: '{data.get('name', 'NOT_FOUND')}'")
    print(f"  first_name: '{data.get('first_name', 'NOT_FOUND')}'") 
    print(f"  last_name: '{data.get('last_name', 'NOT_FOUND')}'")
    print(f"  constituency: {data.get('constituency')}")
    print("---")

print("\n=== CHECKING FUEL DISPATCHES ===")
dispatches = FuelDispatch.objects.select_related('beneficiary__user', 'beneficiary__constituency').all()[:3]
for d in dispatches:
    print(f"Dispatch ID: {d.id}")
    print(f"  Beneficiary: {d.beneficiary}")
    if hasattr(d, 'beneficiary') and d.beneficiary:
        if hasattr(d.beneficiary, 'user') and d.beneficiary.user:
            print(f"    User: {d.beneficiary.user.first_name} {d.beneficiary.user.last_name}")
        if hasattr(d.beneficiary, 'constituency') and d.beneficiary.constituency:
            print(f"    Constituency: {d.beneficiary.constituency.name}")
    print(f"  Liters: {getattr(d, 'liters_dispensed', 'NOT_FOUND')}")
    print(f"  Date: {getattr(d, 'dispatch_date', 'NOT_FOUND')}")
    print("---")