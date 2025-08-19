# Generated manually for SubCenter contact fields and Box is_received field
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '0038_subcenter_capacity'),
    ]

    operations = [
        migrations.AddField(
            model_name='subcenter',
            name='contact_number',
            field=models.CharField(blank=True, help_text='Primary contact phone number for the sub-center', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='subcenter',
            name='email',
            field=models.EmailField(blank=True, help_text='Primary email address for the sub-center', max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='box',
            name='is_received',
            field=models.BooleanField(default=True, help_text='Whether this box has been received (calculated from status or explicit)'),
        ),
    ]
