# Generated manually for adding main_center_dispatch_number to BookDispatch
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('fuel', '10023_bookdispatch_dispatch_type_bookdispatch_from_center_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='bookdispatch',
            name='main_center_dispatch_number',
            field=models.CharField(max_length=30, unique=True, null=True, blank=True, help_text='Primary sequential number for Main Center tracking (auto-generated)')
        ),
    ]
