"""
Simple migration to create just the SerialMovement table
"""
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import model_utils.fields
from django.conf import settings


class Migration(migrations.Migration):
    dependencies = [
        ('fuel', '0018_merge_20250724_1623'),
    ]

    operations = [
        migrations.CreateModel(
            name='SerialMovement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', model_utils.fields.AutoCreatedField(default=django.utils.timezone.now, editable=False, verbose_name='created')),
                ('modified', model_utils.fields.AutoLastModifiedField(default=django.utils.timezone.now, editable=False, verbose_name='modified')),
                ('movement_type', models.CharField(choices=[('BOX_RECEIVED', 'Box Received'), ('BOOK_DISPATCH', 'Book Dispatched'), ('BOOK_RECEIVED', 'Book Received'), ('COUPON_ALLOCATED', 'Coupon Allocated'), ('COUPON_HANDOVER', 'Coupon Handover'), ('COUPON_USED', 'Coupon Used'), ('COUPON_RETURNED', 'Coupon Returned'), ('BOOK_TRANSFERRED', 'Book Transferred'), ('EMERGENCY_ALLOCATION', 'Emergency Allocation')], help_text='Type of serial movement', max_length=30)),
                ('first_serial', models.CharField(help_text='First serial in the movement', max_length=50)),
                ('last_serial', models.CharField(help_text='Last serial in the movement', max_length=50)),
                ('quantity', models.IntegerField(help_text='Number of serials moved')),
                ('notes', models.TextField(blank=True, help_text='Additional notes about this movement')),
                ('movement_date', models.DateTimeField(help_text='When the movement occurred')),
                ('performed_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='serial_movements_performed', to=settings.AUTH_USER_MODEL, help_text='User who performed this movement')),
            ],
            options={
                'verbose_name': 'Serial Movement',
                'verbose_name_plural': 'Serial Movements',
                'ordering': ['-movement_date'],
            },
        ),
    ]
