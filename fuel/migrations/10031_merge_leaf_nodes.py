from django.db import migrations

class Migration(migrations.Migration):
    """
    Direct merge migration to resolve the specific conflict Django reported:
    "multiple leaf nodes in the migration graph: (10018_bookdispatch_main_center_dispatch_number, 10027_merge_20250922_0335 in fuel)"
    
    This migration explicitly merges these two leaf nodes.
    """
    
    dependencies = [
        ('fuel', '10018_bookdispatch_main_center_dispatch_number'),
        ('fuel', '10027_merge_20250922_0335'),
    ]

    operations = [
        # No operations needed - this is just a merge point
    ]