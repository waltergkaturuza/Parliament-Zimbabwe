import os
import sys
import django

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

def check_table_schema():
    with connection.cursor() as cursor:
        # Check if BeneficiaryProfile table exists and its schema
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='fuel_beneficiaryprofile';")
        result = cursor.fetchone()
        if result:
            print("BeneficiaryProfile table schema:")
            print(result[0])
            print("\n" + "="*80 + "\n")
            
            # Get column info
            cursor.execute("PRAGMA table_info(fuel_beneficiaryprofile);")
            columns = cursor.fetchall()
            print("Table columns:")
            for col in columns:
                print(f"- {col[1]} ({col[2]}) - {'NOT NULL' if col[3] else 'NULL'}")
        else:
            print("BeneficiaryProfile table not found")

if __name__ == "__main__":
    check_table_schema()