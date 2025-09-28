import os
import sys
import django

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection, transaction
from fuel.models import SubCenter, BeneficiaryProfile

def assign_beneficiaries_to_subcenters():
    with connection.cursor() as cursor:
        try:
            # Get subcenter IDs
            subcenters = list(SubCenter.objects.all()[:3])
            if len(subcenters) < 2:
                print("Not enough subcenters available")
                return
                
            print(f"Available subcenters: {[sc.name for sc in subcenters]}")
            
            # Get beneficiary IDs
            cursor.execute("SELECT id, employee_id FROM fuel_beneficiaryprofile ORDER BY id;")
            beneficiaries = cursor.fetchall()
            
            if not beneficiaries:
                print("No beneficiaries found")
                return
                
            print(f"Found {len(beneficiaries)} beneficiaries")
            
            # Assign beneficiaries to subcenters in a round-robin fashion
            for i, (beneficiary_id, employee_id) in enumerate(beneficiaries):
                subcenter = subcenters[i % len(subcenters)]
                cursor.execute("""
                    UPDATE fuel_beneficiaryprofile 
                    SET sub_center_id = %s 
                    WHERE id = %s
                """, [subcenter.id, beneficiary_id])
                print(f"Assigned {employee_id} -> {subcenter.name}")
            
            # Verify assignments
            cursor.execute("""
                SELECT bp.employee_id, sc.name as subcenter_name
                FROM fuel_beneficiaryprofile bp
                LEFT JOIN fuel_subcenter sc ON bp.sub_center_id = sc.id
                ORDER BY bp.id;
            """)
            results = cursor.fetchall()
            
            print("\nFinal assignments:")
            for employee_id, subcenter_name in results:
                print(f"- {employee_id} -> {subcenter_name or 'No subcenter'}")
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    assign_beneficiaries_to_subcenters()