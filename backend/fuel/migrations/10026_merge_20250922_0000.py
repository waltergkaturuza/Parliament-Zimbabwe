from django.db import migrations

class Migration(migrations.Migration):
    # Merge migration to resolve multiple leaf nodes in legacy backend/fuel app
    dependencies = [
        ("fuel", "10023_bookdispatch_dispatch_type_bookdispatch_from_center_and_more"),
        ("fuel", "10025_add_main_center_dispatch_number_rebased"),
    ]

    operations = []
