import os
import sys
import django

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection, transaction

def add_subcenter_column():
    with connection.cursor() as cursor:
        try:
            # Check if the column already exists
            cursor.execute("PRAGMA table_info(fuel_beneficiaryprofile);")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            if 'sub_center_id' not in column_names:
                print("Adding sub_center_id column...")
                cursor.execute("""
                    ALTER TABLE fuel_beneficiaryprofile 
                    ADD COLUMN sub_center_id bigint NULL 
                    REFERENCES fuel_subcenter(id) 
                    DEFERRABLE INITIALLY DEFERRED;
                """)
                print("✓ sub_center_id column added successfully!")
            else:
                print("sub_center_id column already exists")
                
            # Verify the column was added
            cursor.execute("PRAGMA table_info(fuel_beneficiaryprofile);")
            columns = cursor.fetchall()
            subcenter_col = [col for col in columns if col[1] == 'sub_center_id']
            if subcenter_col:
                print(f"✓ Verified: sub_center_id column exists - {subcenter_col[0]}")
            else:
                print("❌ Error: sub_center_id column not found after adding")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_subcenter_column()