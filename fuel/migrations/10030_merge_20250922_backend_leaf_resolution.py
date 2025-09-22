from django.db import migrations

class Migration(migrations.Migration):
    """Final merge after adding real 10029_dispatch_aggregates_safe placeholder.

    Ensures a single linear head for future migrations. No schema operations.
    """

    dependencies = [
        ("fuel", "10029_dispatch_aggregates_safe"),
    ]

    operations = []
