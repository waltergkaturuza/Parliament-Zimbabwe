# Generated manually for adding main_center_dispatch_number to BookDispatch
from django.db import migrations

class Migration(migrations.Migration):
    """No-op: original intent duplicated the main_center_dispatch_number column.

    We retain the migration number for graph consistency but remove the AddField
    to prevent duplicate column errors.
    """
    dependencies = [
        ('fuel', '10023_bookdispatch_dispatch_type_bookdispatch_from_center_and_more'),
    ]

    operations = []
