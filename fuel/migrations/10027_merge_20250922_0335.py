from django.db import migrations

class Migration(migrations.Migration):
    """
    Stub migration to resolve production database migration graph conflict.
    
    Production database has references to this migration in django_migrations table
    but the migration file doesn't exist in our codebase. This stub satisfies
    Django's migration dependency requirements.
    """
    
    dependencies = [
        ('fuel', '10017_sync_missing_field'),
    ]

    operations = [
        # No operations - this is a stub to satisfy migration graph dependencies
    ]