from django.db import migrations

# This migration is defensive: environments may already have these columns.
# It only adds missing columns (PostgreSQL or SQLite). If everything exists, it is a no-op.

PG_COLS = [
    ("first_serial", "ALTER TABLE fuel_bookdispatch ADD COLUMN first_serial varchar(50) NULL"),
    ("last_serial", "ALTER TABLE fuel_bookdispatch ADD COLUMN last_serial varchar(50) NULL"),
    ("total_coupons", "ALTER TABLE fuel_bookdispatch ADD COLUMN total_coupons integer NOT NULL DEFAULT 0"),
    ("aggregated_litres", "ALTER TABLE fuel_bookdispatch ADD COLUMN aggregated_litres numeric(14,2) NOT NULL DEFAULT 0"),
    ("aggregated_value_usd", "ALTER TABLE fuel_bookdispatch ADD COLUMN aggregated_value_usd numeric(14,2) NOT NULL DEFAULT 0"),
]

SQLITE_COLS = [
    ("first_serial", "ALTER TABLE fuel_bookdispatch ADD COLUMN first_serial varchar(50)"),
    ("last_serial", "ALTER TABLE fuel_bookdispatch ADD COLUMN last_serial varchar(50)"),
    ("total_coupons", "ALTER TABLE fuel_bookdispatch ADD COLUMN total_coupons integer DEFAULT 0"),
    ("aggregated_litres", "ALTER TABLE fuel_bookdispatch ADD COLUMN aggregated_litres numeric(14,2) DEFAULT 0"),
    ("aggregated_value_usd", "ALTER TABLE fuel_bookdispatch ADD COLUMN aggregated_value_usd numeric(14,2) DEFAULT 0"),
]

CHECK_PG = "SELECT 1 FROM information_schema.columns WHERE table_name='fuel_bookdispatch' AND column_name=%s"
CHECK_SQLITE = "PRAGMA table_info(fuel_bookdispatch)"

def add_missing(apps, schema_editor):
    conn = schema_editor.connection
    vendor = conn.vendor
    cur = conn.cursor()
    if vendor == 'postgresql':
        for col, ddl in PG_COLS:
            cur.execute(CHECK_PG, [col])
            if cur.fetchone() is None:
                schema_editor.execute(ddl)
    else:
        cur.execute(CHECK_SQLITE)
        existing = {r[1] for r in cur.fetchall()}
        for col, ddl in SQLITE_COLS:
            if col not in existing:
                schema_editor.execute(ddl)

def noop(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('fuel', '10029_dispatch_aggregates_safe'), # best-effort ordering; if absent locally it's still fine
    ]

    operations = [
        migrations.RunPython(add_missing, noop),
    ]
