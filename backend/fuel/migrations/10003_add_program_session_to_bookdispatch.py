from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '10002_merge_20250811_1736'),
    ]

    operations = [
        migrations.AddField(
            model_name='bookdispatch',
            name='program',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='book_dispatches', to='fuel.program', help_text='Program this dispatch is associated with (optional)'),
        ),
        migrations.AddField(
            model_name='bookdispatch',
            name='session',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='book_dispatches', to='fuel.parliamentsession', help_text='Parliament session this dispatch is associated with (optional)'),
        ),
        migrations.AddIndex(
            model_name='bookdispatch',
            index=models.Index(fields=['program'], name='fuel_bookdi_program_idx'),
        ),
        migrations.AddIndex(
            model_name='bookdispatch',
            index=models.Index(fields=['session'], name='fuel_bookdi_session_idx'),
        ),
    ]
