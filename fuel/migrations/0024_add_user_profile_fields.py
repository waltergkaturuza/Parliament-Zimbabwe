# Migration to add missing User model fields to match local development
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '0023_fix_coupon_distribution_and_session_attendance'),
    ]

    operations = [
        # Add missing User profile fields
        migrations.AddField(
            model_name='user',
            name='profile_picture',
            field=models.ImageField(blank=True, null=True, upload_to='profile_pictures/', help_text='User profile picture'),
        ),
        migrations.AddField(
            model_name='user',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True, help_text='Date of birth'),
        ),
        migrations.AddField(
            model_name='user',
            name='address',
            field=models.TextField(blank=True, null=True, help_text='Home address'),
        ),
        migrations.AddField(
            model_name='user',
            name='national_id',
            field=models.CharField(blank=True, max_length=20, null=True, help_text='National ID number'),
        ),
        migrations.AddField(
            model_name='user',
            name='employee_id',
            field=models.CharField(blank=True, max_length=20, null=True, help_text='Employee ID number'),
        ),
        migrations.AddField(
            model_name='user',
            name='department',
            field=models.CharField(blank=True, max_length=100, null=True, help_text='Department/Division'),
        ),
        migrations.AddField(
            model_name='user',
            name='position',
            field=models.CharField(blank=True, max_length=100, null=True, help_text='Job position/title'),
        ),
        migrations.AddField(
            model_name='user',
            name='bio',
            field=models.TextField(blank=True, null=True, help_text='User biography/description'),
        ),
        migrations.AddField(
            model_name='user',
            name='preferred_language',
            field=models.CharField(blank=True, choices=[('en', 'English'), ('sn', 'Shona'), ('nd', 'Ndebele')], default='en', max_length=5, help_text='Preferred language for notifications'),
        ),
        migrations.AddField(
            model_name='user',
            name='timezone',
            field=models.CharField(blank=True, default='Africa/Harare', max_length=50, help_text='User timezone'),
        ),
        migrations.AddField(
            model_name='user',
            name='notification_preferences',
            field=models.JSONField(blank=True, default=dict, help_text='User notification preferences'),
        ),
        migrations.AddField(
            model_name='user',
            name='emergency_contact_name',
            field=models.CharField(blank=True, max_length=100, null=True, help_text='Emergency contact name'),
        ),
        migrations.AddField(
            model_name='user',
            name='emergency_contact_phone',
            field=models.CharField(blank=True, max_length=20, null=True, help_text='Emergency contact phone'),
        ),
    ]
