# Generated migration for fixing CouponDistribution model
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '0022_bookdispatch_serial_fields'),
    ]

    operations = [
        # First, ensure CouponDistribution has proper id field if it exists
        migrations.RunSQL(
            """
            DO $$
            BEGIN
                -- Check if CouponDistribution table exists without proper id
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_coupondistribution') THEN
                    -- Check if id column exists
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fuel_coupondistribution' AND column_name = 'id') THEN
                        -- Add id column as primary key
                        ALTER TABLE fuel_coupondistribution ADD COLUMN id SERIAL PRIMARY KEY;
                    END IF;
                END IF;
            END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # Ensure SessionAttendance model is created properly
        migrations.CreateModel(
            name='SessionAttendance',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
                ('attended', models.BooleanField(default=False, help_text='Whether the beneficiary attended this session')),
                ('attendance_date', models.DateTimeField(auto_now_add=True, help_text='When attendance was recorded')),
                ('fuel_allocated', models.DecimalField(blank=True, decimal_places=2, help_text='Fuel allocation for this session (litres)', max_digits=8, null=True)),
                ('allocation_date', models.DateTimeField(blank=True, help_text='When fuel was allocated for this attendance', null=True)),
                ('notes', models.TextField(blank=True, help_text='Additional notes about attendance')),
                ('beneficiary', models.ForeignKey(limit_choices_to={'role': 'BENEFICIARY'}, on_delete=django.db.models.deletion.CASCADE, related_name='session_attendances', to='fuel.user')),
                ('recorded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='recorded_attendances', to='fuel.user')),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendances', to='fuel.parliamentsession')),
            ],
            options={
                'verbose_name': 'Session Attendance',
                'verbose_name_plural': 'Session Attendances',
                'ordering': ['-session__start_date', 'beneficiary__last_name'],
                'indexes': [models.Index(fields=['session'], name='fuel_sessio_session_c9b23e_idx'), models.Index(fields=['beneficiary'], name='fuel_sessio_benefic_d5c5a1_idx'), models.Index(fields=['attendance_date'], name='fuel_sessio_attenda_0f9da4_idx')],
            },
        ),
        
        # Add unique constraint for SessionAttendance
        migrations.AlterUniqueTogether(
            name='sessionattendance',
            unique_together={('session', 'beneficiary')},
        ),
    ]
