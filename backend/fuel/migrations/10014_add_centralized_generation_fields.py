# Generated for centralized book generation

from django.db import migrations, models
import fuel.validators


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '10013_add_books_relationship'),
    ]

    operations = [
        # No-op migration - fields already exist from earlier migrations
        # This migration was originally trying to add fields that were already present
        # in the model, causing "duplicate column" errors
    ]
