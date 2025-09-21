from django.db import migrations

class Migration(migrations.Migration):
    # This placeholder migration was applied in the database but the file was missing.
    # Re-introduced so that future migrations depending on it have a valid source file.
    # Must reference the real prior migration file name present in this directory.
    # The previously used dependency 10016_add_handover_fields_to_bookdispatch does not
    # exist in backend/fuel/migrations; the correct predecessor here is the empty
    # placeholder migration 10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more.
    dependencies = [
        ("fuel", "10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more"),
    ]

    operations = []
