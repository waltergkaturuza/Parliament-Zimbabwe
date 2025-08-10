# Generated manually for FuelRequirementConfiguration

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '10000_merge_20250810_1044'),
    ]

    operations = [
        migrations.CreateModel(
            name='FuelRequirementConfiguration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fuel_type', models.CharField(choices=[('PETROL', 'Petrol'), ('DIESEL', 'Diesel')], max_length=10, verbose_name='Fuel Type')),
                ('period', models.CharField(choices=[('DAILY', 'Daily'), ('WEEKLY', 'Weekly')], max_length=10, verbose_name='Period')),
                ('required_litres', models.DecimalField(decimal_places=2, help_text='Total litres required for this period', max_digits=10, verbose_name='Required Litres')),
                ('litres_per_coupon', models.DecimalField(decimal_places=2, default=5.0, help_text='Litres per coupon (default 5L)', max_digits=6, verbose_name='Litres per Coupon')),
                ('effective_from', models.DateField(help_text='Date when this configuration becomes effective', verbose_name='Effective From')),
                ('is_active', models.BooleanField(default=True, help_text='Whether this configuration is currently active', verbose_name='Is Active')),
                ('notes', models.TextField(blank=True, help_text='Additional notes about this configuration', verbose_name='Notes')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_fuel_requirements', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
            ],
            options={
                'verbose_name': 'Fuel Requirement Configuration',
                'verbose_name_plural': 'Fuel Requirement Configurations',
                'db_table': 'fuel_fuelrequirementconfiguration',
                'ordering': ['-effective_from', 'fuel_type', 'period'],
            },
        ),
        migrations.AddConstraint(
            model_name='fuelrequirementconfiguration',
            constraint=models.UniqueConstraint(condition=models.Q(('is_active', True)), fields=('fuel_type', 'period'), name='unique_active_fuel_requirement'),
        ),
    ]
