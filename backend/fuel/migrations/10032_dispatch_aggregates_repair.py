from decimal import Decimal

from django.db import connection, migrations, models


def _column_exists(cursor, table_name, column_name):
    """Check if column exists using database-agnostic approach"""
    try:
        # Try PostgreSQL/MySQL approach
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = %s
        """, [table_name, column_name])
        return cursor.fetchone() is not None
    except Exception:
        # Fallback to Django introspection for SQLite
        introspection = connection.introspection
        columns = {col.name for col in introspection.get_table_description(cursor, table_name)}
        return column_name in columns


def ensure_aggregated_litres_column(apps, schema_editor):
    BookDispatch = apps.get_model("fuel", "BookDispatch")
    table_name = BookDispatch._meta.db_table

    with connection.cursor() as cursor:
        if _column_exists(cursor, table_name, "aggregated_litres"):
            return

        field = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"), help_text="Cached total litres for fast reporting")
        field.set_attributes_from_name("aggregated_litres")
        schema_editor.add_field(BookDispatch, field)


def ensure_aggregated_value_column(apps, schema_editor):
    BookDispatch = apps.get_model("fuel", "BookDispatch")
    table_name = BookDispatch._meta.db_table

    with connection.cursor() as cursor:
        if _column_exists(cursor, table_name, "aggregated_value_usd"):
            return

        field = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"), help_text="Cached total USD value for fast reporting")
        field.set_attributes_from_name("aggregated_value_usd")
        schema_editor.add_field(BookDispatch, field)


def backfill_dispatch_aggregates(apps, schema_editor):
    BookDispatch = apps.get_model("fuel", "BookDispatch")
    FuelPrice = apps.get_model("fuel", "FuelPrice")

    default_price = Decimal("1.45")
    try:
        current_price = FuelPrice.objects.order_by("-created").first()
        if current_price and getattr(current_price, "price_per_litre_usd", None):
            default_price = Decimal(str(current_price.price_per_litre_usd))
    except Exception:
        pass

    dispatch_qs = BookDispatch.objects.all()

    for dispatch in dispatch_qs.iterator(chunk_size=100):
        total_coupons = 0
        total_litres = Decimal("0")
        total_value = Decimal("0")

        for book in dispatch.books.all():
            coupon_count = getattr(book, "initial_coupon_count", None) or 100
            total_coupons += coupon_count

            box = getattr(book, "box", None)
            denomination = getattr(box, "denomination", None) or 20
            litres = Decimal(str(coupon_count * denomination))
            total_litres += litres

            price_per_litre = getattr(box, "fuel_price_per_litre_usd", None)
            if price_per_litre is None:
                price_per_litre = default_price
            total_value += litres * Decimal(str(price_per_litre))

        updates = []
        if dispatch.total_coupons != total_coupons:
            dispatch.total_coupons = total_coupons
            updates.append("total_coupons")
        if dispatch.aggregated_litres != total_litres:
            dispatch.aggregated_litres = total_litres
            updates.append("aggregated_litres")
        if dispatch.aggregated_value_usd != total_value:
            dispatch.aggregated_value_usd = total_value
            updates.append("aggregated_value_usd")

        if updates:
            dispatch.save(update_fields=updates)


class Migration(migrations.Migration):

    dependencies = [
        ("fuel", "10029_add_program_to_fuelentitlement"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(ensure_aggregated_litres_column, migrations.RunPython.noop),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="bookdispatch",
                    name="aggregated_litres",
                    field=models.DecimalField(
                        default=Decimal("0"),
                        decimal_places=2,
                        max_digits=14,
                        help_text="Cached total litres for fast reporting",
                    ),
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(ensure_aggregated_value_column, migrations.RunPython.noop),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="bookdispatch",
                    name="aggregated_value_usd",
                    field=models.DecimalField(
                        default=Decimal("0"),
                        decimal_places=2,
                        max_digits=14,
                        help_text="Cached total USD value for fast reporting",
                    ),
                ),
            ],
        ),
        migrations.RunPython(backfill_dispatch_aggregates, migrations.RunPython.noop),
    ]
