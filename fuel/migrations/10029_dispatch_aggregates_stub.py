from django.db import migrations

class Migration(migrations.Migration):
    """
    Stub migration to mirror a previously deployed backend/fuel 10029 migration name.
    This exists only to let Django merge the graph in environments where a migration
    record with name '10029_dispatch_aggregates_safe' (backend path) may have been
    registered or expected. All aggregate columns are already added safely earlier
    by 10019_add_dispatch_aggregates_safe in the canonical root 'fuel' app.
    """

    # Depend on 10019 so ordering is preserved. Numbered deliberately as 10029 to
    # align with the conflicting leaf reported in production logs.
    dependencies = [
        ("fuel", "10020_merge_20250922_conflict_resolution"),  # after existing merge
    ]

    operations = []
