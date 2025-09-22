from django.db import migrations

class Migration(migrations.Migration):
    """
    Stub migration to satisfy production database migration dependencies.
    This migration exists in the production django_migrations table but
    was missing from our codebase, causing conflicts.
    """
    
    dependencies = [
        ('fuel', '10017_sync_missing_field'),
    ]

    operations = [
        # This is a stub - no operations needed
        # Production database expects this migration to exist
    ]