"""
Django management command to fix Azure production database schema
Adds missing USD monetary fields to Box model
"""

from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings


class Command(BaseCommand):
    help = 'Fix Azure production database schema by adding missing USD monetary fields'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force execution even on non-production databases',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🔧 Starting Azure production database schema fix...')
        )

        # Check if we're in production environment (Azure)
        is_production = (
            hasattr(settings, 'DATABASES') and 
            'postgresql' in settings.DATABASES.get('default', {}).get('ENGINE', '') or
            options['force']
        )

        if not is_production and not options['force']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️ This command is designed for Azure production PostgreSQL database.\n'
                    'Use --force to run on other environments.'
                )
            )
            return

        with connection.cursor() as cursor:
            try:
                # Check if the fields exist
                self.stdout.write('📋 Checking existing database schema...')
                
                # For PostgreSQL (Azure production)
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'fuel_box'
                    AND table_schema = 'public';
                """)
                columns = [row[0] for row in cursor.fetchall()]
                
                self.stdout.write(f'✅ Found {len(columns)} columns in fuel_box table')

                # Define missing fields and their SQL
                missing_fields = {
                    'monetary_value_usd': """
                        ALTER TABLE fuel_box 
                        ADD COLUMN monetary_value_usd DECIMAL(12,2) NULL;
                    """,
                    'fuel_price_per_litre_usd': """
                        ALTER TABLE fuel_box 
                        ADD COLUMN fuel_price_per_litre_usd DECIMAL(8,2) NULL;
                    """,
                    'exchange_rate': """
                        ALTER TABLE fuel_box 
                        ADD COLUMN exchange_rate DECIMAL(10,2) NULL;
                    """
                }

                # Check which fields need to be added
                fields_to_add = []
                for field_name, sql in missing_fields.items():
                    if field_name not in columns:
                        fields_to_add.append((field_name, sql))
                        self.stdout.write(
                            self.style.WARNING(f'❌ Missing field: {field_name}')
                        )
                    else:
                        self.stdout.write(
                            self.style.SUCCESS(f'✅ Field exists: {field_name}')
                        )

                # Add missing fields
                if fields_to_add:
                    self.stdout.write(f'\n🔧 Adding {len(fields_to_add)} missing fields...')
                    
                    for field_name, sql in fields_to_add:
                        try:
                            cursor.execute(sql)
                            self.stdout.write(
                                self.style.SUCCESS(f'✅ Added: {field_name}')
                            )
                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(f'❌ Error adding {field_name}: {e}')
                            )
                            
                    # Commit the changes
                    connection.commit()
                    self.stdout.write(
                        self.style.SUCCESS('💾 Database changes committed successfully!')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS('✅ All required fields already exist!')
                    )

                # Also ensure box_code allows blank values (for auto-generation)
                self.stdout.write('\n🔧 Ensuring box_code field configuration...')
                try:
                    cursor.execute("""
                        ALTER TABLE fuel_box 
                        ALTER COLUMN box_code DROP NOT NULL;
                    """)
                    self.stdout.write(
                        self.style.SUCCESS('✅ box_code field updated to allow null/blank values')
                    )
                    connection.commit()
                except Exception as e:
                    if 'does not exist' in str(e) or 'already allows null' in str(e):
                        self.stdout.write(
                            self.style.SUCCESS('ℹ️ box_code field already properly configured')
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'ℹ️ box_code field modification: {e}')
                        )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Database schema check failed: {e}')
                )
                self.stdout.write(
                    self.style.WARNING('💡 Ensure this is running on Azure PostgreSQL database')
                )
                return

        self.stdout.write(
            self.style.SUCCESS('\n🚀 Azure production database schema fix completed!')
        )
        self.stdout.write(
            self.style.SUCCESS('✅ Box creation should now work without USD field errors')
        )
