"""Stub migration file to satisfy applied migration record.

The original migration that added the main_center_dispatch_number column was
applied under this name in some environments but the file went missing / was
renamed. We restore a no-op stub so Django can load the historical graph.

DO NOT REMOVE – downstream merge migrations reference both 10018 variants.
"""
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('fuel', '10017_merge_20250901_1204'),
    ]

    operations = [
        # No operations – real column already exists (or will be created by the other 10018 variant).
    ]
