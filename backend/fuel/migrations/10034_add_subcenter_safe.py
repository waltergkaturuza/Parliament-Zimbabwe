"""
No-op migration to maintain dependency chain.
The subcenter field is properly added in 10033_add_subcenter_minimal.
"""

from django.db import migrations


class Migration(migrations.Migration):
    """
    Placeholder migration to maintain dependency chain.
    The actual subcenter field addition is handled by 10033_add_subcenter_minimal.
    """
    
    dependencies = [
        ('fuel', '10033_add_subcenter_minimal'),
    ]

    operations = [
        # No operations needed - the subcenter field is added in 10033_add_subcenter_minimal
        # This migration exists only to maintain the migration dependency chain
    ]