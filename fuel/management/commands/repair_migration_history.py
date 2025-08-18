"""
Safely repair migration history by fake-applying known no-op migrations
that resolve the dependency chain inconsistency seen in production.

Specifically targets:
 - fuel.0002_add_missing_fields (no-op)
 - fuel.10001_add_fuel_requirement_configuration (no-op)
 - fuel.10002_merge_20250811_1736 (merge, no-op)
Then runs a full migrate.
"""

from django.core.management.base import BaseCommand
from django.core.management import call_command


NOOP_MIGRATIONS = [
    ("fuel", "0002_add_missing_fields"),
    ("fuel", "10001_add_fuel_requirement_configuration"),
    ("fuel", "10002_merge_20250811_1736"),
]


class Command(BaseCommand):
    help = "Repair migration history by fake-applying known no-op dependencies, then migrate."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("🧩 Repairing migration history (no-op chain)"))

        self.stdout.write("\n📊 Current fuel app migration status:")
        try:
            call_command("showmigrations", "fuel")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Could not show migrations: {e}"))

        for app_label, name in NOOP_MIGRATIONS:
            self.stdout.write(self.style.MIGRATE_HEADING(f"\n➡️  Fake-applying {app_label}.{name}…"))
            try:
                call_command("migrate", app_label, name, fake=True, interactive=False)
                self.stdout.write(self.style.SUCCESS(f"✅ Marked {app_label}.{name} as applied (fake)."))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"⚠️ Could not fake-apply {app_label}.{name}: {e}"))

        self.stdout.write(self.style.MIGRATE_HEADING("\n▶️ Running full migrate…"))
        try:
            call_command("migrate", interactive=False)
            self.stdout.write(self.style.SUCCESS("✅ Migration repair completed and all migrations applied."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Full migration step failed: {e}"))

        self.stdout.write("\n📊 Final fuel app migration status:")
        try:
            call_command("showmigrations", "fuel")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Could not show migrations: {e}"))
