from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Backfill cached aggregate fields on BookDispatch (first_serial, last_serial, total_coupons, aggregated_litres, aggregated_value_usd). Safe to re-run."

    def add_arguments(self, parser):
        parser.add_argument('--batch', type=int, default=1000, help='Batch size for processing dispatches')
        parser.add_argument('--dry-run', action='store_true', help='Perform calculations without saving')
        parser.add_argument('--ids', type=str, help='Comma-separated list of dispatch IDs to limit scope')

    def handle(self, *args, **options):
        # Import from the active app label 'fuel' so command works with INSTALLED_APPS referencing 'fuel'
        from fuel.models import BookDispatch  # noqa: WPS433 (runtime import intentional)
        batch_size = options['batch']
        dry_run = options['dry_run']
        id_filter = options.get('ids')

        qs = BookDispatch.objects.all().order_by('id')
        if id_filter:
            ids = [int(i.strip()) for i in id_filter.split(',') if i.strip().isdigit()]
            qs = qs.filter(id__in=ids)

        total = qs.count()
        processed = 0
        updated = 0
        self.stdout.write(self.style.NOTICE(f"Starting backfill for {total} dispatch rows (batch={batch_size}, dry_run={dry_run})"))

        while processed < total:
            batch = list(qs[processed:processed + batch_size])
            if not batch:
                break
            for dispatch in batch:
                orig_first = dispatch.first_serial
                orig_last = dispatch.last_serial
                orig_coupons = dispatch.total_coupons
                orig_litres = dispatch.aggregated_litres
                orig_value = dispatch.aggregated_value_usd

                dispatch.recalculate_aggregates(save=False)

                changed = any([
                    dispatch.first_serial != orig_first,
                    dispatch.last_serial != orig_last,
                    dispatch.total_coupons != orig_coupons,
                    dispatch.aggregated_litres != orig_litres,
                    dispatch.aggregated_value_usd != orig_value,
                ])

                if changed and not dry_run:
                    update_fields = []
                    if dispatch.first_serial != orig_first:
                        update_fields.append('first_serial')
                    if dispatch.last_serial != orig_last:
                        update_fields.append('last_serial')
                    if dispatch.total_coupons != orig_coupons:
                        update_fields.append('total_coupons')
                    if dispatch.aggregated_litres != orig_litres:
                        update_fields.append('aggregated_litres')
                    if dispatch.aggregated_value_usd != orig_value:
                        update_fields.append('aggregated_value_usd')
                    if not dispatch.main_center_dispatch_number:
                        dispatch.main_center_dispatch_number = f"MCD-{dispatch.id:05d}"
                        update_fields.append('main_center_dispatch_number')
                    if update_fields:
                        with transaction.atomic():
                            dispatch.save(update_fields=update_fields)
                        updated += 1
            processed += len(batch)
            self.stdout.write(f"Processed {processed}/{total} (updated {updated})")
        self.stdout.write(self.style.SUCCESS(f"Backfill complete. Updated {updated} dispatch rows out of {total}."))
