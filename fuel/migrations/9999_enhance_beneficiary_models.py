# Generated migration for frontend enhancements
# fuel/migrations/XXXX_enhance_beneficiary_models.py

from django.db import migrations, models
import decimal

class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '0001_initial'),  # Replace with latest migration
    ]

    operations = [
        # Enhance BeneficiaryProfile with vehicle and contact information
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='vehicle_make',
            field=models.CharField(blank=True, help_text='Vehicle manufacturer (e.g., Toyota, Mercedes)', max_length=50),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='vehicle_model',
            field=models.CharField(blank=True, help_text='Vehicle model (e.g., Prado, C-Class)', max_length=50),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='vehicle_year',
            field=models.IntegerField(blank=True, help_text='Year of manufacture', null=True),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='engine_size',
            field=models.CharField(blank=True, help_text='Engine size (e.g., 2.0L, 3.0L V6)', max_length=20),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='vehicle_registration',
            field=models.CharField(blank=True, help_text='Vehicle registration number', max_length=20),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='fuel_type',
            field=models.CharField(choices=[('PETROL', 'Petrol'), ('DIESEL', 'Diesel')], default='DIESEL', help_text='Type of fuel the vehicle uses', max_length=10),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='office_location',
            field=models.CharField(blank=True, help_text='Office location/room number', max_length=200),
        ),
        
        # Enhanced allocation profile fields
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='base_allocation',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('200'), help_text='Base monthly allocation before multipliers', max_digits=8),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='category_multiplier',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('1.0'), help_text='Role-based multiplier (MP: 1.5, Senator: 1.4, etc.)', max_digits=4),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='engine_multiplier',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('1.0'), help_text='Engine size-based multiplier', max_digits=4),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='last_allocation_date',
            field=models.DateTimeField(blank=True, help_text='Date of last fuel allocation', null=True),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='current_balance',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0'), help_text='Current fuel balance in litres', max_digits=8),
        ),
        migrations.AddField(
            model_name='beneficiaryprofile',
            name='used_this_month',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0'), help_text='Fuel used in current month', max_digits=8),
        ),
        
        # Enhance CouponAllocation with session and event information
        migrations.AddField(
            model_name='couponallocation',
            name='session_name',
            field=models.CharField(blank=True, help_text='Name of parliamentary session', max_length=200),
        ),
        migrations.AddField(
            model_name='couponallocation',
            name='program_name',
            field=models.CharField(blank=True, help_text='Name of program/committee', max_length=200),
        ),
        migrations.AddField(
            model_name='couponallocation',
            name='event_name',
            field=models.CharField(blank=True, help_text='Specific event name (optional)', max_length=200),
        ),
        migrations.AddField(
            model_name='couponallocation',
            name='allocation_type',
            field=models.CharField(choices=[('SESSION', 'Parliamentary Session'), ('COMMITTEE', 'Committee Meeting'), ('EVENT', 'Special Event'), ('EMERGENCY', 'Emergency Allocation')], default='SESSION', help_text='Type of allocation', max_length=20),
        ),
        migrations.AddField(
            model_name='couponallocation',
            name='total_value',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0'), help_text='Total monetary value of allocation', max_digits=12),
        ),
        migrations.AddField(
            model_name='couponallocation',
            name='expiry_date',
            field=models.DateField(blank=True, help_text='Expiry date for allocated coupons', null=True),
        ),
        migrations.AddField(
            model_name='couponallocation',
            name='coupons_used',
            field=models.IntegerField(default=0, help_text='Number of coupons already used'),
        ),
        migrations.AddField(
            model_name='couponallocation',
            name='coupons_remaining',
            field=models.IntegerField(default=0, help_text='Number of coupons remaining'),
        ),
        
        # Add category multiplier to BeneficiaryCategory
        migrations.AddField(
            model_name='beneficiarycategory',
            name='category_multiplier',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('1.0'), help_text='Multiplier for this category (MP: 1.5, Senator: 1.4, etc.)', max_digits=4),
        ),
    ]
