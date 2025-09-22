# Custom migration to add main_center_dispatch_number to BookDispatch
from django.db import migrations, models


def backfill_main_center_numbers(apps, schema_editor):
    BookDispatch = apps.get_model('fuel', 'BookDispatch')
    # Order by primary key for deterministic numbering
    for dispatch in BookDispatch.objects.all().order_by('id'):
        if not getattr(dispatch, 'main_center_dispatch_number', None):
            dispatch.main_center_dispatch_number = f"MCD-{dispatch.id:05d}"
            dispatch.save(update_fields=['main_center_dispatch_number'])


class Migration(migrations.Migration):
    """Convert duplicate AddField migration into idempotent backfill-only.

    The column may have been added already by the sibling migration
    10018_bookdispatch_main_center_dispatch_number (applied in production).
    We skip adding the field explicitly to avoid duplicate column errors and
    only perform backfill if the field exists and is empty.
    """
    dependencies = [
        ('fuel', '10017_merge_20250901_1204'),
    ]

    operations = [
        migrations.RunPython(backfill_main_center_numbers, migrations.RunPython.noop),
    ]
