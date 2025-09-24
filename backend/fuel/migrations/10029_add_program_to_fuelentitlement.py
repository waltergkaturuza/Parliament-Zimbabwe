# Safe migration to replace 10029_add_program_to_fuelentitlement.py
import django.db.models.deletion
import django.utils.timezone
import fuel.validators
from django.conf import settings
from django.db import migrations, models, connection


def check_column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    with connection.cursor() as cursor:
        # Different query for SQLite vs PostgreSQL
        if connection.vendor == 'sqlite':
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = [column[1] for column in cursor.fetchall()]
            return column_name in columns
        else:  # PostgreSQL
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = %s AND column_name = %s
            """, [table_name, column_name])
            return cursor.fetchone()[0] > 0


def safe_add_field(apps, schema_editor, model_name, field_name, field):
    """Safely add a field only if it doesn't exist"""
    table_name = f"fuel_{model_name.lower()}"
    if not check_column_exists(table_name, field_name):
        # Field doesn't exist, safe to add
        model = apps.get_model('fuel', model_name)
        # Create a fake field for the schema editor
        field.set_attributes_from_name(field_name)
        schema_editor.add_field(model, field)


def safe_remove_field(apps, schema_editor, model_name, field_name):
    """Safely remove a field only if it exists"""
    table_name = f"fuel_{model_name.lower()}"
    if check_column_exists(table_name, field_name):
        # Field exists, safe to remove
        model = apps.get_model('fuel', model_name)
        field = model._meta.get_field(field_name)
        schema_editor.remove_field(model, field)


def forward_safe_migrations(apps, schema_editor):
    """Apply safe migrations with checks"""
    
    # Book fields - safely add if they don't exist
    safe_add_field(apps, schema_editor, 'Book', 'first_coupon_serial',
                   models.CharField(blank=True, help_text='First coupon serial in this book (e.g., PU006H1355101)', max_length=50, null=True, validators=[fuel.validators.validate_petrotrade_serial]))
    
    safe_add_field(apps, schema_editor, 'Book', 'is_generated',
                   models.BooleanField(default=False, help_text='Whether this book was generated via the centralized service'))
    
    safe_add_field(apps, schema_editor, 'Book', 'last_coupon_serial',
                   models.CharField(blank=True, help_text='Last coupon serial in this book (e.g., PU006H1355200)', max_length=50, null=True, validators=[fuel.validators.validate_petrotrade_serial]))
    
    # Box fields - safely add if they don't exist
    safe_add_field(apps, schema_editor, 'Box', 'first_coupon_serial',
                   models.CharField(blank=True, help_text='First coupon serial in the box (e.g., PU006H1355101)', max_length=50, null=True, validators=[fuel.validators.validate_petrotrade_serial]))
    
    safe_add_field(apps, schema_editor, 'Box', 'last_coupon_serial',
                   models.CharField(blank=True, help_text='Last coupon serial in the box (e.g., PU006H1356100)', max_length=50, null=True, validators=[fuel.validators.validate_petrotrade_serial]))
    
    safe_add_field(apps, schema_editor, 'Box', 'total_books',
                   models.IntegerField(blank=True, help_text='Total number of books that will be generated for this box', null=True))
    
    # BookDispatch fields - safely add if they don't exist
    safe_add_field(apps, schema_editor, 'BookDispatch', 'aggregated_litres',
                   models.DecimalField(decimal_places=2, default=0, help_text='Cached total litres for fast reporting', max_digits=14))
    
    safe_add_field(apps, schema_editor, 'BookDispatch', 'aggregated_value_usd',
                   models.DecimalField(decimal_places=2, default=0, help_text='Cached total USD value for fast reporting', max_digits=14))
    
    safe_add_field(apps, schema_editor, 'BookDispatch', 'main_center_dispatch_number',
                   models.CharField(blank=True, help_text='Primary sequential number for Main Center tracking (auto-generated)', max_length=30, null=True, unique=True))

    # FuelEntitlement program field - safely add if it doesn't exist
    Program = apps.get_model('fuel', 'Program')
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'program',
                   models.ForeignKey(Program, blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='fuel_entitlements'))


def reverse_safe_migrations(apps, schema_editor):
    """Reverse the safe migrations"""
    
    # Remove fields safely
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'program')
    safe_remove_field(apps, schema_editor, 'BookDispatch', 'main_center_dispatch_number')
    safe_remove_field(apps, schema_editor, 'BookDispatch', 'aggregated_value_usd')
    safe_remove_field(apps, schema_editor, 'BookDispatch', 'aggregated_litres')
    safe_remove_field(apps, schema_editor, 'Box', 'total_books')
    safe_remove_field(apps, schema_editor, 'Box', 'last_coupon_serial')
    safe_remove_field(apps, schema_editor, 'Box', 'first_coupon_serial')
    safe_remove_field(apps, schema_editor, 'Book', 'last_coupon_serial')
    safe_remove_field(apps, schema_editor, 'Book', 'is_generated')
    safe_remove_field(apps, schema_editor, 'Book', 'first_coupon_serial')


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '10028_merge_production_conflicts'),
    ]

    operations = [
        # First, handle CouponHandover model changes (these are safe)
        migrations.AlterModelOptions(
            name='couponhandover',
            options={'ordering': ['-created'], 'verbose_name': 'Coupon Handover', 'verbose_name_plural': 'Coupon Handovers'},
        ),
        migrations.RemoveField(
            model_name='couponhandover',
            name='handover_date',
        ),
        
        # Apply safe field additions using custom function
        migrations.RunPython(forward_safe_migrations, reverse_safe_migrations),
        
        # Continue with other safe operations that don't involve field additions
        migrations.AddField(
            model_name='coupon',
            name='coupon_serial',
            field=models.CharField(db_index=True, default='', help_text='Unique coupon serial number matching Petrotrade format', max_length=50, validators=[fuel.validators.validate_petrotrade_serial]),
        ),
        migrations.AddField(
            model_name='coupon',
            name='coupon_value',
            field=models.IntegerField(default=20, help_text='Fuel denomination in litres (10L or 20L)'),
        ),
        migrations.AddField(
            model_name='coupon',
            name='page_number',
            field=models.IntegerField(blank=True, help_text='Page number within the book (for printing purposes)', null=True),
        ),
        migrations.AddField(
            model_name='fuelentitlement',
            name='approved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='entitlements_approved', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='fuelentitlement',
            name='approved_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='fuelentitlement',
            name='session',
            field=models.ForeignKey(blank=True, help_text='Parliament session this entitlement is for', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='fuel_entitlements', to='fuel.parliamentsession'),
        ),
        migrations.AlterField(
            model_name='fuelentitlement',
            name='created',
            field=models.DateTimeField(default=django.utils.timezone.now, help_text='When this entitlement was created'),
        ),
        migrations.AlterField(
            model_name='fuelentitlement',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('dispatched', 'Dispatched')], default='pending', help_text='Current status of the entitlement', max_length=20),
        ),
        migrations.AlterField(
            model_name='fuelentitlement',
            name='user',
            field=models.ForeignKey(help_text='The beneficiary who receives this entitlement', on_delete=django.db.models.deletion.CASCADE, related_name='fuel_entitlements', to=settings.AUTH_USER_MODEL),
        ),
    ]