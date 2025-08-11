"""
This migration was previously attempting to (re)create FuelRequirementConfiguration but
the model already exists in earlier migrations (0001_initial). The original dependency
also referenced a nonexistent merge migration. We convert this into a no-op migration
that simply depends on the last valid migration to restore graph integrity.
"""

from django.db import migrations


class Migration(migrations.Migration):

    # Depend on the last valid migration present in this app
    dependencies = [
        ('fuel', '0008_enhance_book_coupon_tracking'),
    ]

    # No operations; keep schema unchanged
    operations = []
