# Generated manually to fix Program location field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '0027_dynamicallocation_fuelallocationrule_fuelprice_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='program',
            name='location',
            field=models.CharField(blank=True, default='', help_text='Program venue or location', max_length=200),
        ),
    ]