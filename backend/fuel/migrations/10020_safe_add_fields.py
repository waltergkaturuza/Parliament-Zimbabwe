# Safe migration to add fields only if they don't exist
import django.db.models.deletion
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


def add_safe_fields(apps, schema_editor):
    """Add fields safely, checking for existence first"""
    
    # Book fields
    safe_add_field(apps, schema_editor, 'Book', 'first_coupon_serial', 
                   models.CharField(blank=True, help_text='First coupon serial in this book', max_length=50, null=True))
    safe_add_field(apps, schema_editor, 'Book', 'is_generated', 
                   models.BooleanField(default=False, help_text='Whether this book was generated via the centralized service'))
    safe_add_field(apps, schema_editor, 'Book', 'last_coupon_serial', 
                   models.CharField(blank=True, help_text='Last coupon serial in this book', max_length=50, null=True))
    
    # Box fields
    safe_add_field(apps, schema_editor, 'Box', 'first_coupon_serial', 
                   models.CharField(blank=True, help_text='First coupon serial in the box', max_length=50, null=True))
    safe_add_field(apps, schema_editor, 'Box', 'last_coupon_serial', 
                   models.CharField(blank=True, help_text='Last coupon serial in the box', max_length=50, null=True))
    safe_add_field(apps, schema_editor, 'Box', 'total_books', 
                   models.IntegerField(blank=True, help_text='Total number of books', null=True))
    
    # Coupon fields
    safe_add_field(apps, schema_editor, 'Coupon', 'coupon_serial', 
                   models.CharField(db_index=True, default='', help_text='Unique coupon serial', max_length=50))
    safe_add_field(apps, schema_editor, 'Coupon', 'coupon_value', 
                   models.IntegerField(default=20, help_text='Fuel denomination in litres'))
    safe_add_field(apps, schema_editor, 'Coupon', 'page_number', 
                   models.IntegerField(blank=True, help_text='Page number within the book', null=True))
    
    # FuelEntitlement fields
    User = apps.get_model(settings.AUTH_USER_MODEL)
    ParliamentSession = apps.get_model('fuel', 'ParliamentSession')
    
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'approved_by', 
                   models.ForeignKey(User, blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='entitlements_approved'))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'approved_date', 
                   models.DateTimeField(blank=True, null=True))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'created_by', 
                   models.ForeignKey(User, blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='entitlements_created'))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'entitlement_type', 
                   models.CharField(choices=[('MONTHLY', 'Monthly'), ('SESSION', 'Session'), ('COMMITTEE', 'Committee')], default='MONTHLY', max_length=20))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'justification', 
                   models.TextField(blank=True, default=''))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'litres_allocated', 
                   models.DecimalField(decimal_places=2, default=0, max_digits=8))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'litres_entitled', 
                   models.DecimalField(decimal_places=2, default=200, max_digits=8))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'notes', 
                   models.TextField(blank=True))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'period_end', 
                   models.DateField(blank=True, null=True))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'period_start', 
                   models.DateField(blank=True, null=True))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'session', 
                   models.ForeignKey(ParliamentSession, blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='fuel_entitlements'))
    safe_add_field(apps, schema_editor, 'FuelEntitlement', 'status', 
                   models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved')], default='PENDING', max_length=20))


def reverse_safe_fields(apps, schema_editor):
    """Reverse the migration by removing added fields"""
    # Remove FuelEntitlement fields
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'status')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'session')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'period_start')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'period_end')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'notes')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'litres_entitled')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'litres_allocated')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'justification')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'entitlement_type')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'created_by')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'approved_date')
    safe_remove_field(apps, schema_editor, 'FuelEntitlement', 'approved_by')
    
    # Remove Coupon fields
    safe_remove_field(apps, schema_editor, 'Coupon', 'page_number')
    safe_remove_field(apps, schema_editor, 'Coupon', 'coupon_value')
    safe_remove_field(apps, schema_editor, 'Coupon', 'coupon_serial')
    
    # Remove Box fields
    safe_remove_field(apps, schema_editor, 'Box', 'total_books')
    safe_remove_field(apps, schema_editor, 'Box', 'last_coupon_serial')
    safe_remove_field(apps, schema_editor, 'Box', 'first_coupon_serial')
    
    # Remove Book fields
    safe_remove_field(apps, schema_editor, 'Book', 'last_coupon_serial')
    safe_remove_field(apps, schema_editor, 'Book', 'is_generated')
    safe_remove_field(apps, schema_editor, 'Book', 'first_coupon_serial')


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '10019_add_party_affiliation_backfill'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='fuelentitlement',
            options={'ordering': ['-created'], 'verbose_name': 'Fuel Entitlement', 'verbose_name_plural': 'Fuel Entitlements'},
        ),
        migrations.RunPython(add_safe_fields, reverse_safe_fields),
    ]
