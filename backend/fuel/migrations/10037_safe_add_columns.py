# Safe migration to add columns only if they don't exist
from django.db import migrations, connection


def check_column_exists(table, column):
    """Check if a column exists in a table"""
    with connection.cursor() as cursor:
        # For PostgreSQL, use the correct syntax
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = %s
        """, [table, column])
        return cursor.fetchone() is not None


def add_columns_if_not_exist(apps, schema_editor):
    """Add columns only if they don't already exist"""
    with connection.cursor() as cursor:
        # Check and add fuel_book columns
        if not check_column_exists('fuel_book', 'first_coupon_serial'):
            cursor.execute("""
                ALTER TABLE fuel_book 
                ADD COLUMN first_coupon_serial VARCHAR(50) NULL
            """)
        
        if not check_column_exists('fuel_book', 'is_generated'):
            cursor.execute("""
                ALTER TABLE fuel_book 
                ADD COLUMN is_generated BOOLEAN DEFAULT FALSE NOT NULL
            """)
        
        if not check_column_exists('fuel_book', 'last_coupon_serial'):
            cursor.execute("""
                ALTER TABLE fuel_book 
                ADD COLUMN last_coupon_serial VARCHAR(50) NULL
            """)
        
        # Check and add fuel_bookdispatch columns
        if not check_column_exists('fuel_bookdispatch', 'main_center_dispatch_number'):
            cursor.execute("""
                ALTER TABLE fuel_bookdispatch 
                ADD COLUMN main_center_dispatch_number VARCHAR(30) NULL UNIQUE
            """)
        
        # Check and add fuel_box columns
        if not check_column_exists('fuel_box', 'first_coupon_serial'):
            cursor.execute("""
                ALTER TABLE fuel_box 
                ADD COLUMN first_coupon_serial VARCHAR(50) NULL
            """)
        
        if not check_column_exists('fuel_box', 'last_coupon_serial'):
            cursor.execute("""
                ALTER TABLE fuel_box 
                ADD COLUMN last_coupon_serial VARCHAR(50) NULL
            """)
        
        if not check_column_exists('fuel_box', 'total_books'):
            cursor.execute("""
                ALTER TABLE fuel_box 
                ADD COLUMN total_books INTEGER NULL
            """)


def reverse_add_columns(apps, schema_editor):
    """Remove columns if they exist (rollback)"""
    with connection.cursor() as cursor:
        # Remove fuel_book columns
        if check_column_exists('fuel_book', 'first_coupon_serial'):
            cursor.execute("ALTER TABLE fuel_book DROP COLUMN first_coupon_serial")
        
        if check_column_exists('fuel_book', 'is_generated'):
            cursor.execute("ALTER TABLE fuel_book DROP COLUMN is_generated")
        
        if check_column_exists('fuel_book', 'last_coupon_serial'):
            cursor.execute("ALTER TABLE fuel_book DROP COLUMN last_coupon_serial")
        
        # Remove fuel_bookdispatch columns
        if check_column_exists('fuel_bookdispatch', 'main_center_dispatch_number'):
            cursor.execute("ALTER TABLE fuel_bookdispatch DROP COLUMN main_center_dispatch_number")
        
        # Remove fuel_box columns
        if check_column_exists('fuel_box', 'first_coupon_serial'):
            cursor.execute("ALTER TABLE fuel_box DROP COLUMN first_coupon_serial")
        
        if check_column_exists('fuel_box', 'last_coupon_serial'):
            cursor.execute("ALTER TABLE fuel_box DROP COLUMN last_coupon_serial")
        
        if check_column_exists('fuel_box', 'total_books'):
            cursor.execute("ALTER TABLE fuel_box DROP COLUMN total_books")


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '10035_rollback_migration_fix'),
    ]

    operations = [
        migrations.RunPython(
            add_columns_if_not_exist,
            reverse_add_columns,
        ),
    ]