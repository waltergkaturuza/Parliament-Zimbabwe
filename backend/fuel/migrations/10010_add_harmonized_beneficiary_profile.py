# Generated manually for HarmonizedBeneficiaryProfile model

from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '10009_add_verification_sign_off_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='HarmonizedBeneficiaryProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
                ('parliamentary_id', models.CharField(help_text='Official parliamentary identification number', max_length=50, unique=True)),
                ('employee_id', models.CharField(blank=True, help_text='Employee ID for staff members', max_length=50, null=True, unique=True)),
                ('position', models.CharField(blank=True, max_length=100)),
                ('department', models.CharField(blank=True, max_length=100)),
                ('party_affiliation', models.CharField(blank=True, max_length=100)),
                ('date_of_birth', models.DateField(blank=True, null=True)),
                ('national_id', models.CharField(max_length=50, unique=True)),
                ('full_address', models.TextField(blank=True)),
                ('office_location', models.CharField(blank=True, max_length=200)),
                ('office_phone', models.CharField(blank=True, max_length=20)),
                ('mobile_phone', models.CharField(blank=True, max_length=20)),
                ('official_email', models.EmailField(blank=True, max_length=254)),
                ('personal_email', models.EmailField(blank=True, max_length=254)),
                ('vehicle_make', models.CharField(blank=True, max_length=50)),
                ('vehicle_model', models.CharField(blank=True, max_length=50)),
                ('vehicle_year', models.IntegerField(blank=True, null=True)),
                ('engine_size', models.CharField(blank=True, max_length=20)),
                ('vehicle_registration', models.CharField(blank=True, max_length=20)),
                ('fuel_type', models.CharField(choices=[('PETROL', 'Petrol'), ('DIESEL', 'Diesel')], default='DIESEL', max_length=10)),
                ('base_allocation', models.DecimalField(decimal_places=2, default=Decimal('200'), max_digits=8)),
                ('category_multiplier', models.DecimalField(decimal_places=2, default=Decimal('1.0'), max_digits=4)),
                ('engine_multiplier', models.DecimalField(decimal_places=2, default=Decimal('1.0'), max_digits=4)),
                ('monthly_entitlement_litres', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('max_per_transaction', models.DecimalField(decimal_places=2, default=Decimal('50'), max_digits=8)),
                ('status', models.CharField(choices=[('ACTIVE', 'Active'), ('INACTIVE', 'Inactive'), ('SUSPENDED', 'Suspended'), ('PENDING_APPROVAL', 'Pending Approval')], default='ACTIVE', max_length=20)),
                ('is_active_beneficiary', models.BooleanField(default=True)),
                ('current_balance', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=8)),
                ('used_this_month', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=8)),
                ('last_month_usage', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=8)),
                ('year_to_date_usage', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=8)),
                ('total_usage_all_time', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=8)),
                ('last_allocation_date', models.DateTimeField(blank=True, null=True)),
                ('last_login', models.DateTimeField(blank=True, null=True)),
                ('join_date', models.DateTimeField(auto_now_add=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='harmonized_beneficiaries', to='fuel.beneficiarycategory')),
                ('constituency', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='harmonized_constituency_beneficiaries', to='fuel.constituency')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='harmonized_profile', to='fuel.user')),
                ('vehicle_category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='harmonized_vehicle_beneficiaries', to='fuel.vehiclecategory')),
            ],
            options={
                'verbose_name': 'Harmonized Beneficiary Profile',
                'verbose_name_plural': 'Harmonized Beneficiary Profiles',
                'ordering': ['user__username'],
            },
        ),
    ]
