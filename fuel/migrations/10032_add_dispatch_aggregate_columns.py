from django.db import migrations


def add_dispatch_aggregate_columns(apps, schema_editor):
    """Add aggregate columns to BookDispatch if they don't exist."""
    connection = schema_editor.connection
    cursor = connection.cursor()
    
    # List of columns to add with their definitions
    columns_to_add = [
        ("first_serial", "varchar(50)"),
        ("last_serial", "varchar(50)"), 
        ("total_coupons", "integer DEFAULT 0"),
        ("aggregated_litres", "numeric(14,2) DEFAULT 0"),
        ("aggregated_value_usd", "numeric(14,2) DEFAULT 0"),
    ]
    
    for column_name, column_def in columns_to_add:
        # Check if column exists
        if connection.vendor == 'postgresql':
            cursor.execute(
                "SELECT 1 FROM information_schema.columns WHERE table_name='fuel_bookdispatch' AND column_name=%s",
                [column_name]
            )
            column_exists = cursor.fetchone() is not None
            
            if not column_exists:
                # Add the column for PostgreSQL
                cursor.execute(f"ALTER TABLE fuel_bookdispatch ADD COLUMN {column_name} {column_def}")
                
        else:
            # SQLite fallback
            cursor.execute("PRAGMA table_info(fuel_bookdispatch)")
            existing_columns = [row[1] for row in cursor.fetchall()]
            
            if column_name not in existing_columns:
                # Add the column for SQLite
                cursor.execute(f"ALTER TABLE fuel_bookdispatch ADD COLUMN {column_name} {column_def}")


def remove_dispatch_aggregate_columns(apps, schema_editor):
    """Remove aggregate columns (reverse migration)."""
    # We don't remove columns in reverse to avoid data loss
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('fuel', '10031_merge_20250922_conflict_resolution'),
    ]

    operations = [
        migrations.RunPython(add_dispatch_aggregate_columns, remove_dispatch_aggregate_columns),
    ]