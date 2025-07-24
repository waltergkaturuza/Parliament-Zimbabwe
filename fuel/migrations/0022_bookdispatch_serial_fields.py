"""
Simple migration to add only the BookDispatch serial tracking fields
"""
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('fuel', '0020_simple_serialmovement'),
    ]

    operations = [
        migrations.AddField(
            model_name='bookdispatch',
            name='first_serial',
            field=models.CharField(blank=True, help_text='First coupon serial in this dispatch', max_length=50),
        ),
        migrations.AddField(
            model_name='bookdispatch',
            name='last_serial',
            field=models.CharField(blank=True, help_text='Last coupon serial in this dispatch', max_length=50),
        ),
        migrations.AddField(
            model_name='bookdispatch',
            name='total_coupons',
            field=models.IntegerField(default=0, help_text='Total number of coupons in this dispatch'),
        ),
    ]
