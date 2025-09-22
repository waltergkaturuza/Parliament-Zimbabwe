from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '10027_merge_20250922_0335'),
    ]

    operations = [
        migrations.AddField(
            model_name='bookdispatch',
            name='first_serial',
            field=models.CharField(blank=True, help_text='First coupon serial in this dispatch', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='bookdispatch',
            name='last_serial',
            field=models.CharField(blank=True, help_text='Last coupon serial in this dispatch', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='bookdispatch',
            name='total_coupons',
            field=models.IntegerField(default=0, help_text='Total number of coupons in this dispatch'),
        ),
        migrations.AddField(
            model_name='bookdispatch',
            name='aggregated_litres',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Cached total litres for fast reporting', max_digits=14),
        ),
        migrations.AddField(
            model_name='bookdispatch',
            name='aggregated_value_usd',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Cached total USD value for fast reporting', max_digits=14),
        ),
    ]
