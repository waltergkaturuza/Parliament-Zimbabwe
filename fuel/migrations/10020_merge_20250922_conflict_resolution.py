from django.db import migrations

class Migration(migrations.Migration):
    # This merge migration resolves conflicting leaf nodes reported in production.
    # It creates a single linear continuation after 10018 and 10019 (aggregates safe add).
    dependencies = [
        ('fuel', '10018_bookdispatch_main_center_dispatch_number'),
        ('fuel', '10019_add_dispatch_aggregates_safe'),
        ('fuel', '10027_merge_20250922_0335'),
    ]

    operations = [
        # No operations; serves only to merge graph.
    ]
