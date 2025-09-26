"""
Minimal migration to add subcenter field to beneficiary profile.
This replaces the problematic 10033 migration with only the essential changes.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add only the sub_center field to BeneficiaryProfile.
    All other fields from the original 10033 migration already exist in production.
    """

    dependencies = [
        ('fuel', '10032_dispatch_aggregates_repair'),
    ]

    operations = [
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='sub_center',
            field=models.ForeignKey(
                blank=True,
                help_text='Sub-center this beneficiary is assigned to',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='beneficiaries',
                to='fuel.subcenter'
            ),
        ),
    ]