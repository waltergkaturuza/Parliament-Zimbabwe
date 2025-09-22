from django.db import migrations
from django.conf import settings

# We will use raw SQL to avoid duplicate column errors in environments where some partial attempts ran.
# This migration is SAFE and IDEMPOTENT: each ALTER TABLE guarded by an existence check.
# Supports PostgreSQL (production) and SQLite (local dev).

PG_ADD_COLUMNS = [
    ("first_serial", "ALTER TABLE fuel_bookdispatch ADD COLUMN first_serial varchar(50) NULL"),
    ("last_serial", "ALTER TABLE fuel_bookdispatch ADD COLUMN last_serial varchar(50) NULL"),
    ("total_coupons", "ALTER TABLE fuel_bookdispatch ADD COLUMN total_coupons integer NOT NULL DEFAULT 0"),
    ("aggregated_litres", "ALTER TABLE fuel_bookdispatch ADD COLUMN aggregated_litres numeric(14,2) NOT NULL DEFAULT 0"),
    ("aggregated_value_usd", "ALTER TABLE fuel_bookdispatch ADD COLUMN aggregated_value_usd numeric(14,2) NOT NULL DEFAULT 0"),
]

SQLITE_ADD_COLUMNS = [
    ("first_serial", "ALTER TABLE fuel_bookdispatch ADD COLUMN first_serial varchar(50)"),
    ("last_serial", "ALTER TABLE fuel_bookdispatch ADD COLUMN last_serial varchar(50)"),
    ("total_coupons", "ALTER TABLE fuel_bookdispatch ADD COLUMN total_coupons integer DEFAULT 0"),
    ("aggregated_litres", "ALTER TABLE fuel_bookdispatch ADD COLUMN aggregated_litres numeric(14,2) DEFAULT 0"),
    ("aggregated_value_usd", "ALTER TABLE fuel_bookdispatch ADD COLUMN aggregated_value_usd numeric(14,2) DEFAULT 0"),
]

CHECK_COLUMN_PG = """
SELECT 1 FROM information_schema.columns 
WHERE table_name='fuel_bookdispatch' AND column_name=%s
"""

CHECK_COLUMN_SQLITE = "PRAGMA table_info(fuel_bookdispatch)"  # we'll scan result rows


def add_missing_columns(apps, schema_editor):
    connection = schema_editor.connection
    vendor = connection.vendor
    cursor = connection.cursor()
    if vendor == 'postgresql':
        for col, ddl in PG_ADD_COLUMNS:
            cursor.execute(CHECK_COLUMN_PG, [col])
            exists = cursor.fetchone() is not None
            if not exists:
                schema_editor.execute(ddl)
    else:  # sqlite or other - best effort
        cursor.execute(CHECK_COLUMN_SQLITE)
        existing_cols = {row[1] for row in cursor.fetchall()}  # row[1] is name
        for col, ddl in SQLITE_ADD_COLUMNS:
            if col not in existing_cols:
                schema_editor.execute(ddl)


def reverse_noop(apps, schema_editor):
    # We DO NOT drop columns in reverse to avoid data loss; noop keeps migration reversible formally.
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('fuel', '10028_add_dispatch_aggregates'),  # ensure we logically follow attempted standard migration
    ]

    operations = [
        migrations.RunPython(add_missing_columns, reverse_noop),
    ]
