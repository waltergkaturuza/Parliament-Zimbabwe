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
    dependencies = [
        ('fuel', '10017_merge_20250901_1204'),
    ]

    operations = [
        migrations.AddField(
            model_name='bookdispatch',
            name='main_center_dispatch_number',
            field=models.CharField(max_length=30, unique=True, null=True, blank=True, help_text='Primary sequential number for Main Center tracking (auto-generated)'),
        ),
        migrations.RunPython(backfill_main_center_numbers, migrations.RunPython.noop),
    ]
