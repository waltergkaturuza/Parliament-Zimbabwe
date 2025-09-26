from django.db import connection, migrations, models


def add_subcenter_field_safe(apps, schema_editor):
    """Safely add sub_center field to BeneficiaryProfile if it doesn't exist"""
    
    # Check if the column already exists
    with connection.cursor() as cursor:
        try:
            # PostgreSQL/MySQL approach
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = %s AND column_name = %s
            """, ['fuel_beneficiaryprofile', 'sub_center_id'])
            exists = cursor.fetchone() is not None
        except Exception:
            # SQLite fallback
            try:
                cursor.execute("PRAGMA table_info(fuel_beneficiaryprofile)")
                columns = [row[1] for row in cursor.fetchall()]
                exists = 'sub_center_id' in columns
            except Exception:
                exists = False
        
        if not exists:
            # Column doesn't exist, so add it
            cursor.execute("""
                ALTER TABLE fuel_beneficiaryprofile 
                ADD COLUMN sub_center_id INTEGER
            """)
            # Add foreign key constraint if supported
            try:
                cursor.execute("""
                    ALTER TABLE fuel_beneficiaryprofile 
                    ADD CONSTRAINT fk_beneficiary_subcenter 
                    FOREIGN KEY (sub_center_id) REFERENCES fuel_subcenter(id)
                """)
            except Exception:
                # Some databases don't support adding FK constraints after column creation
                pass
            print("Added sub_center_id column to fuel_beneficiaryprofile")
        else:
            print("sub_center_id column already exists in fuel_beneficiaryprofile")


def reverse_subcenter_field(apps, schema_editor):
    """Remove sub_center field if it exists"""
    with connection.cursor() as cursor:
        try:
            # PostgreSQL/MySQL approach
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = %s AND column_name = %s
            """, ['fuel_beneficiaryprofile', 'sub_center_id'])
            exists = cursor.fetchone() is not None
        except Exception:
            # SQLite fallback
            try:
                cursor.execute("PRAGMA table_info(fuel_beneficiaryprofile)")
                columns = [row[1] for row in cursor.fetchall()]
                exists = 'sub_center_id' in columns
            except Exception:
                exists = False
        
        if exists:
            cursor.execute("ALTER TABLE fuel_beneficiaryprofile DROP COLUMN sub_center_id")


class Migration(migrations.Migration):
    dependencies = [
        ('fuel', '10032_dispatch_aggregates_repair'),
    ]

    operations = [
        migrations.RunPython(
            add_subcenter_field_safe,
            reverse_subcenter_field
        ),
        
        # Add the field to Django's migration state
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='sub_center',
            field=models.ForeignKey(
                blank=True,
                help_text='Sub-center this beneficiary is assigned to',
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name='beneficiaries',
                to='fuel.subcenter'
            ),
        ),
    ]