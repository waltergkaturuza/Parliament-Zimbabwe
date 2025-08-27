from django.db import migrations


def noop_backfill(apps, schema_editor):
    # Placeholder for future backfill logic once a mapping is defined.
    # Intentionally do nothing to keep migration fast and safe.
    BookDispatch = apps.get_model('fuel', 'BookDispatch')  # noqa: F401
    return


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '10003_add_program_session_to_bookdispatch'),
    ]

    operations = [
        migrations.RunPython(noop_backfill, reverse_code=migrations.RunPython.noop),
    ]
