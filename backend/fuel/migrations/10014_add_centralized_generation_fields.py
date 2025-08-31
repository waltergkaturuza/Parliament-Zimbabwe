# Generated for centralized book generation

from django.db import migrations, models
import fuel.validators


class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '10013_add_books_relationship'),
    ]

    operations = [
        # Add serial fields to Box - only if they don't exist
        migrations.AddField(
            model_name='box',
            name='first_coupon_serial',
            field=models.CharField(blank=True, help_text='First coupon serial in the box (e.g., PU006H1355101)', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='box',
            name='last_coupon_serial',
            field=models.CharField(blank=True, help_text='Last coupon serial in the box (e.g., PU006H1356100)', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='box',
            name='total_books',
            field=models.IntegerField(blank=True, help_text='Total number of books that will be generated for this box', null=True),
        ),
        migrations.AddField(
            model_name='box',
            name='coupons_per_book',
            field=models.IntegerField(blank=True, help_text='Number of coupons per book (set during generation)', null=True),
        ),
        
        # Add serial fields to Book
        migrations.AddField(
            model_name='book',
            name='first_coupon_serial',
            field=models.CharField(blank=True, help_text='First coupon serial in this book (e.g., PU006H1355101)', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='book',
            name='last_coupon_serial',
            field=models.CharField(blank=True, help_text='Last coupon serial in this book (e.g., PU006H1355200)', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='book',
            name='total_coupons',
            field=models.IntegerField(default=0, help_text='Total number of coupons in this book'),
        ),
        migrations.AddField(
            model_name='book',
            name='is_generated',
            field=models.BooleanField(default=False, help_text='Whether this book was generated via the centralized service'),
        ),
        
        # Add serial field to Coupon
        migrations.AddField(
            model_name='coupon',
            name='coupon_serial',
            field=models.CharField(blank=True, help_text='Unique coupon serial (e.g., PU006H1355101 - PetroTrade format)', max_length=50, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='coupon',
            name='page_number',
            field=models.IntegerField(blank=True, help_text='Page number within the book (1-based)', null=True),
        ),
        migrations.AddField(
            model_name='coupon',
            name='fuel_type',
            field=models.CharField(default='DIESEL', help_text='Type of fuel (PETROL/DIESEL)', max_length=10),
        ),
        migrations.AddField(
            model_name='coupon',
            name='coupon_value',
            field=models.IntegerField(default=20, help_text='Fuel denomination in litres'),
        ),
        migrations.AddField(
            model_name='coupon',
            name='is_used',
            field=models.BooleanField(default=False, help_text='Whether this coupon has been used'),
        ),
    ]
