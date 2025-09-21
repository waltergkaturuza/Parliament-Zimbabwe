from django.db import migrations, models
from django.db.models import Max


def backfill_main_center_dispatch_number(apps, schema_editor):
    BookDispatch = apps.get_model('fuel', 'BookDispatch')
    # Find existing highest numeric sequence among already generated values (if any)
    prefix = 'MCD-'
    max_num = 0
    for value in BookDispatch.objects.exclude(main_center_dispatch_number__isnull=True).exclude(main_center_dispatch_number__exact="").values_list('main_center_dispatch_number', flat=True):
        if value.startswith(prefix):
            try:
                num = int(value.split(prefix)[1])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                continue

    # Assign numbers to rows missing a value in stable created order
    queryset = BookDispatch.objects.filter(models.Q(main_center_dispatch_number__isnull=True) | models.Q(main_center_dispatch_number__exact="")).order_by('created')
    counter = max_num
    updates = []
    for obj in queryset.iterator():
        counter += 1
        obj.main_center_dispatch_number = f"{prefix}{counter:05d}"
        updates.append(obj)
    if updates:
        BookDispatch.objects.bulk_update(updates, ['main_center_dispatch_number'])


def reverse_backfill(apps, schema_editor):
    # We do not reverse the numbering safely; leave values intact.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("fuel", "10017_sync_missing_field"),
    ]

    operations = [
        migrations.AddField(
            model_name='bookdispatch',
            name='main_center_dispatch_number',
            field=models.CharField(blank=True, max_length=32, null=True, unique=True),
        ),
        migrations.RunPython(backfill_main_center_dispatch_number, reverse_backfill),
    ]
