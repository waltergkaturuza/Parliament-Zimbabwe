"""Add main_center_dispatch_number field to BookDispatch model.

This migration adds the main_center_dispatch_number field using a defensive approach
that checks if the column already exists before attempting to add it.
"""
from django.db import migrations, models


def add_main_center_dispatch_number_field(apps, schema_editor):
    """Add main_center_dispatch_number field if it doesn't exist."""
    connection = schema_editor.connection
    cursor = connection.cursor()
    
    # Check if column exists
    if connection.vendor == 'postgresql':
        cursor.execute(
            "SELECT 1 FROM information_schema.columns WHERE table_name='fuel_bookdispatch' AND column_name='main_center_dispatch_number'"
        )
        field_exists = cursor.fetchone() is not None
    else:
        # SQLite fallback
        cursor.execute("PRAGMA table_info(fuel_bookdispatch)")
        columns = [row[1] for row in cursor.fetchall()]
        field_exists = 'main_center_dispatch_number' in columns
    
    if not field_exists:
        # Add the column
        if connection.vendor == 'postgresql':
            cursor.execute(
                "ALTER TABLE fuel_bookdispatch ADD COLUMN main_center_dispatch_number varchar(30) NULL"
            )
            cursor.execute(
                "CREATE UNIQUE INDEX CONCURRENTLY fuel_bookdispatch_main_center_dispatch_number_key ON fuel_bookdispatch (main_center_dispatch_number) WHERE main_center_dispatch_number IS NOT NULL"
            )
        else:
            # SQLite
            cursor.execute(
                "ALTER TABLE fuel_bookdispatch ADD COLUMN main_center_dispatch_number varchar(30)"
            )


class Migration(migrations.Migration):
    dependencies = [
        ('fuel', '10017_merge_20250901_1204'),
    ]

    operations = [
        migrations.RunPython(add_main_center_dispatch_number_field, migrations.RunPython.noop),
    ]
