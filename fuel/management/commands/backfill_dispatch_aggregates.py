from django.core.management.base import BaseCommand
from django.db import transaction
from fuel.models import BookDispatch


class Command(BaseCommand):
    help = "Backfill aggregate metrics (serials, coupons, litres, USD value) for BookDispatch records."

    def add_arguments(self, parser):
        parser.add_argument('--batch', type=int, default=200, help='Batch size of dispatch rows')
        parser.add_argument('--dry-run', action='store_true', help='Preview without saving changes')
        parser.add_argument('--ids', type=str, help='Comma-separated dispatch IDs to limit scope')

    def handle(self, *args, **options):
        batch = options['batch']
        dry = options['dry_run']
        ids = options.get('ids')
        qs = BookDispatch.objects.all().order_by('id')
        if ids:
            id_list = [int(x.strip()) for x in ids.split(',') if x.strip().isdigit()]
            qs = qs.filter(id__in=id_list)
        total = qs.count()
        self.stdout.write(self.style.NOTICE(f"Processing {total} dispatch rows..."))
        updated = 0
        index = 0
        while index < total:
            subset = list(qs[index:index+batch])
            index += batch
            if not subset:
                break
            with transaction.atomic():
                for dispatch in subset:
                    before = (
                        dispatch.first_serial,
                        dispatch.last_serial,
                        dispatch.total_coupons,
                        dispatch.aggregated_litres,
                        dispatch.aggregated_value_usd,
                        dispatch.main_center_dispatch_number,
                    )
                    dispatch.recalculate_aggregates(save=not dry)
                    after = (
                        dispatch.first_serial,
                        dispatch.last_serial,
                        dispatch.total_coupons,
                        dispatch.aggregated_litres,
                        dispatch.aggregated_value_usd,
                        dispatch.main_center_dispatch_number,
                    )
                    if before != after and not dry:
                        updated += 1
            self.stdout.write(f"Progress: {min(index,total)}/{total} (updated: {updated})")
        if dry:
            self.stdout.write(self.style.WARNING(f"Dry run complete. {updated} would be updated."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Backfill complete. {updated} dispatch rows updated."))
