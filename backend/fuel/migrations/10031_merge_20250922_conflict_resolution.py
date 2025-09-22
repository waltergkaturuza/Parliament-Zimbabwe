from django.db import migrations

# Merge migration to resolve conflicting leaf nodes:
#   - 10018_bookdispatch_main_center_dispatch_number
#   - 10030_dispatch_aggregate_columns_safe
# This creates a single linear head so future migrations apply cleanly.
# No schema operations are required; both branches already applied/covered.

class Migration(migrations.Migration):
    dependencies = [
        ("fuel", "10018_bookdispatch_main_center_dispatch_number"),
        ("fuel", "10030_dispatch_aggregate_columns_safe"),
    ]

    operations = []
