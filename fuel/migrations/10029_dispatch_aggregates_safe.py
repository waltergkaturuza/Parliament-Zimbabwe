from django.db import migrations

class Migration(migrations.Migration):
    """
    Placeholder / alignment migration.

    Production reported a conflicting leaf node named '10029_dispatch_aggregates_safe' in the
    'fuel' app which did not exist in the canonical repository. This no-op file is introduced
    to reconcile the migration graph without executing any schema changes (aggregate columns
    were already added safely by 10019_add_dispatch_aggregates_safe).
    """

    dependencies = [
        ("fuel", "10020_merge_20250922_conflict_resolution"),
    ]

    operations = []
