from django.db import migrations

class Migration(migrations.Migration):
    """Final merge to collapse divergent leaf involving stub 10029.

    After adding the stub 10029, this merge ensures a single linear head for subsequent
    migrations. Safe no-op.
    """

    dependencies = [
        ("fuel", "10029_dispatch_aggregates_stub"),
    ]

    operations = []
