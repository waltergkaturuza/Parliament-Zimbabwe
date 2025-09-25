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
    
    # For foreign key fields, Django creates a column with "_id" suffix
    # Check the actual database column name
    if hasattr(field, 'remote_field') and field.remote_field is not None:
        # This is a ForeignKey field
        db_column_name = f"{field_name}_id"
    else:
        # Regular field
        db_column_name = field_name
    
    if not check_column_exists(table_name, db_column_name):
        # Field doesn't exist, safe to add
        model = apps.get_model('fuel', model_name)
        # Create a fake field for the schema editor
        field.set_attributes_from_name(field_name)
        schema_editor.add_field(model, field)


def safe_remove_field(apps, schema_editor, model_name, field_name):
    """Safely remove a field only if it exists"""
    table_name = f"fuel_{model_name.lower()}"
    
    # For foreign key fields, Django creates a column with "_id" suffix
    # We need to check the actual database column name
    model = apps.get_model('fuel', model_name)
    try:
        field = model._meta.get_field(field_name)
        if hasattr(field, 'remote_field') and field.remote_field is not None:
            # This is a ForeignKey field
            db_column_name = f"{field_name}_id"
        else:
            # Regular field
            db_column_name = field_name
    except:
        # Field might not exist in model, try both possibilities
        db_column_name = field_name
        if not check_column_exists(table_name, field_name):
            db_column_name = f"{field_name}_id"
    
    if check_column_exists(table_name, db_column_name):
        # Field exists, safe to remove
        try:
            field = model._meta.get_field(field_name)
            schema_editor.remove_field(model, field)
        except:
            # Field might not be in model definition anymore
            pass


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

    # Coupon fields - safely add if they don't exist
    safe_add_field(apps, schema_editor, 'Coupon', 'coupon_serial',
                   models.CharField(db_index=True, default='', help_text='Unique coupon serial number matching Petrotrade format', max_length=50, validators=[fuel.validators.validate_petrotrade_serial]))
    
    safe_add_field(apps, schema_editor, 'Coupon', 'coupon_value',
                   models.IntegerField(default=20, help_text='Fuel denomination in litres (10L or 20L)'))
    
    safe_add_field(apps, schema_editor, 'Coupon', 'page_number',
                   models.IntegerField(blank=True, help_text='Page number within the book (for printing purposes)', null=True))

    # FuelEntitlement fields - safely add if they don't exist
    User = apps.get_model(settings.AUTH_USER_MODEL)
    ParliamentSession = apps.get_model('fuel', 'ParliamentSession')
    Program = apps.get_model('fuel', 'Program')
    
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'program',
                   models.ForeignKey(Program, blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='fuel_entitlements'))
    
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'approved_by',
                   models.ForeignKey(User, blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='entitlements_approved'))
    
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'approved_date',
                   models.DateTimeField(blank=True, null=True))
    
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'session',
                   models.ForeignKey(ParliamentSession, blank=True, help_text='Parliament session this entitlement is for', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='fuel_entitlements'))
    
    # Add basic FuelEntitlement fields that might be missing
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'created',
                   models.DateTimeField(default=django.utils.timezone.now, help_text='When this entitlement was created'))
    
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'status',
                   models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('dispatched', 'Dispatched')], default='pending', help_text='Current status of the entitlement', max_length=20))
    
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'user',
                   models.ForeignKey(User, blank=True, null=True, help_text='The beneficiary who receives this entitlement', on_delete=django.db.models.deletion.CASCADE, related_name='fuel_entitlements'))


def reverse_safe_migrations(apps, schema_editor):
    """Reverse the safe migrations"""
    
    # Remove fields safely in reverse order
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'user')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'status')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'created')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'session')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'approved_date')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'approved_by')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'program')
    safe_remove_field(apps, schema_editor, 'Coupon', 'page_number')
    safe_remove_field(apps, schema_editor, 'Coupon', 'coupon_value')
    safe_remove_field(apps, schema_editor, 'Coupon', 'coupon_serial')
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
        
        # Apply ALL field additions safely using custom function
        # This includes all FuelEntitlement fields with proper configuration
        migrations.RunPython(forward_safe_migrations, reverse_safe_migrations),
    ]