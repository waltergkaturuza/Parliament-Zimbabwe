# Migration for Enhanced Coupon Handover System
# This creates the CouponHandover model for physical coupon distribution to beneficiaries

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '0025_enhance_book_dispatch_intelligent_generation'),
    ]

    operations = [
        migrations.CreateModel(
            name='CouponHandover',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
                
                # Core handover information
                ('handover_id', models.CharField(max_length=50, unique=True, help_text='Unique handover identifier')),
                ('handover_mode', models.CharField(max_length=50, choices=[
                    ('entitlement-based', 'Entitlement-Based Handover'),
                    ('serial-range', 'Serial Range Handover'),
                    ('quantity-based', 'Quantity-Based Handover'),
                    ('emergency-allocation', 'Emergency Allocation'),
                ], default='entitlement-based', help_text='Intelligent generation mode used')),
                
                # Status tracking
                ('status', models.CharField(max_length=20, choices=[
                    ('PENDING', 'Pending'),
                    ('CONFIGURED', 'Configured'),
                    ('VERIFIED', 'Verified'),
                    ('HANDED_OVER', 'Handed Over'),
                    ('RECEIVED', 'Received'),
                    ('CONFIRMED', 'Confirmed'),
                    ('CANCELLED', 'Cancelled'),
                ], default='PENDING', help_text='Current status of handover')),
                
                # Relationships
                ('beneficiary', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='coupon_handovers',
                    to=settings.AUTH_USER_MODEL,
                    help_text='Beneficiary receiving the coupons'
                )),
                ('sub_center', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='coupon_handovers',
                    to='fuel.SubCenter',
                    help_text='Sub-center managing this handover'
                )),
                ('handed_over_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    blank=True,
                    related_name='handovers_given',
                    to=settings.AUTH_USER_MODEL,
                    help_text='User who performed the handover'
                )),
                ('received_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    blank=True,
                    related_name='handovers_received',
                    to=settings.AUTH_USER_MODEL,
                    help_text='User who received the coupons'
                )),
                
                # Coupon tracking
                ('coupons', models.ManyToManyField(
                    'fuel.Coupon',
                    related_name='handovers',
                    help_text='Coupons included in this handover'
                )),
                ('first_serial', models.CharField(
                    max_length=50,
                    blank=True,
                    help_text='First coupon serial in handover'
                )),
                ('last_serial', models.CharField(
                    max_length=50,
                    blank=True,
                    help_text='Last coupon serial in handover'
                )),
                ('total_coupons', models.IntegerField(
                    default=0,
                    help_text='Total number of coupons in handover'
                )),
                ('total_litres', models.DecimalField(
                    max_digits=10,
                    decimal_places=2,
                    default=0,
                    help_text='Total litres in handover'
                )),
                ('total_value', models.DecimalField(
                    max_digits=12,
                    decimal_places=2,
                    default=0,
                    help_text='Total value of handover in USD'
                )),
                
                # Handover method and logistics
                ('handover_method', models.CharField(max_length=30, choices=[
                    ('DIRECT_PICKUP', 'Direct Pickup'),
                    ('OFFICE_DELIVERY', 'Office Delivery'),
                    ('COURIER', 'Courier Service'),
                    ('REPRESENTATIVE', 'Authorized Representative'),
                ], default='DIRECT_PICKUP', help_text='Method of handover')),
                
                # Representative details
                ('representative_name', models.CharField(
                    max_length=100,
                    blank=True,
                    help_text='Name of authorized representative'
                )),
                ('representative_id', models.CharField(
                    max_length=50,
                    blank=True,
                    help_text='Representative ID number'
                )),
                ('representative_phone', models.CharField(
                    max_length=20,
                    blank=True,
                    help_text='Representative contact number'
                )),
                ('authorization_letter', models.TextField(
                    blank=True,
                    help_text='Authorization letter details'
                )),
                
                # Handover logistics
                ('scheduled_date', models.DateField(
                    null=True,
                    blank=True,
                    help_text='Scheduled handover date'
                )),
                ('scheduled_time', models.TimeField(
                    null=True,
                    blank=True,
                    help_text='Scheduled handover time'
                )),
                ('handover_location', models.CharField(
                    max_length=200,
                    blank=True,
                    help_text='Location where handover took place'
                )),
                ('special_instructions', models.TextField(
                    blank=True,
                    help_text='Special handling instructions'
                )),
                
                # Date/time tracking
                ('handed_over_date', models.DateField(
                    null=True,
                    blank=True,
                    help_text='Actual handover date'
                )),
                ('handed_over_time', models.TimeField(
                    null=True,
                    blank=True,
                    help_text='Actual handover time'
                )),
                ('received_date', models.DateField(
                    null=True,
                    blank=True,
                    help_text='Date when beneficiary received'
                )),
                ('received_time', models.TimeField(
                    null=True,
                    blank=True,
                    help_text='Time when beneficiary received'
                )),
                
                # Verification and signatures
                ('verification_checks', models.JSONField(
                    default=list,
                    blank=True,
                    help_text='List of completed verification checks'
                )),
                ('verification_notes', models.TextField(
                    blank=True,
                    help_text='Notes from verification process'
                )),
                ('verified_by', models.CharField(
                    max_length=100,
                    blank=True,
                    help_text='Name of person who verified'
                )),
                ('verified_at', models.DateTimeField(
                    null=True,
                    blank=True,
                    help_text='When verification was completed'
                )),
                
                # Digital signatures
                ('beneficiary_signature', models.TextField(
                    blank=True,
                    help_text='Digital signature of beneficiary'
                )),
                ('representative_signature', models.TextField(
                    blank=True,
                    help_text='Digital signature of representative'
                )),
                ('witness_signature', models.TextField(
                    blank=True,
                    help_text='Digital signature of witness'
                )),
                ('witness_name', models.CharField(
                    max_length=100,
                    blank=True,
                    help_text='Name of witness'
                )),
                
                # Documentation
                ('handover_document', models.TextField(
                    blank=True,
                    help_text='Generated handover document data'
                )),
                ('receipt_generated', models.BooleanField(
                    default=False,
                    help_text='Whether receipt has been generated'
                )),
                ('delivery_note', models.CharField(
                    max_length=200,
                    blank=True,
                    help_text='Delivery note reference'
                )),
                ('handover_notes', models.TextField(
                    blank=True,
                    help_text='Additional handover notes'
                )),
                
                # Entitlement tracking
                ('based_on_entitlement', models.BooleanField(
                    default=True,
                    help_text='Whether handover was based on entitlement calculation'
                )),
                ('entitlement_amount', models.DecimalField(
                    max_digits=10,
                    decimal_places=2,
                    null=True,
                    blank=True,
                    help_text='Entitlement amount this handover fulfills'
                )),
                ('overrides_entitlement', models.BooleanField(
                    default=False,
                    help_text='Whether this handover overrides normal entitlement limits'
                )),
                ('emergency_reason', models.TextField(
                    blank=True,
                    help_text='Reason for emergency allocation'
                )),
                ('approved_by', models.CharField(
                    max_length=100,
                    blank=True,
                    help_text='Who approved emergency allocation'
                )),
            ],
            options={
                'ordering': ['-created'],
                'verbose_name': 'Coupon Handover',
                'verbose_name_plural': 'Coupon Handovers',
            },
        ),
        
        # Add indexes for performance
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_coupon_handover_beneficiary ON fuel_couponhandover(beneficiary_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_coupon_handover_beneficiary;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_coupon_handover_status ON fuel_couponhandover(status);",
            reverse_sql="DROP INDEX IF EXISTS idx_coupon_handover_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_coupon_handover_date ON fuel_couponhandover(handed_over_date);",
            reverse_sql="DROP INDEX IF EXISTS idx_coupon_handover_date;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_coupon_handover_subcenter ON fuel_couponhandover(sub_center_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_coupon_handover_subcenter;"
        ),
    ]
