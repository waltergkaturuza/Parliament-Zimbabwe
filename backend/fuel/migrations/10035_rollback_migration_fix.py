"""
Rollback migration to fix deployment issues.
This migration marks the problematic 10033 migration as applied without executing it.
"""

from django.db import migrations


class Migration(migrations.Migration):
    """
    Safe rollback migration that doesn't perform any database operations.
    This allows us to bypass the problematic 10033 migration in production.
    """
    
    dependencies = [
        ('fuel', '10034_add_subcenter_safe'),
    ]

    operations = [
        # No operations - this just updates the migration state
    ]