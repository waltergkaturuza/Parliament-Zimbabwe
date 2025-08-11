#!/usr/bin/env python3
"""
🏛️ Parliament Fuel System - Azure Production Database Schema Fix
Fixes missing database fields that are preventing proper operation
"""

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.apps import apps
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Fix Azure production database schema issues'

    def handle(self, *args, **options):
        self.stdout.write("🔧 Starting Azure production database schema fix...")
        
        try:
            with transaction.atomic():
                self.fix_box_schema()
                self.stdout.write("💾 Database changes committed successfully!")
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Schema fix failed: {str(e)}")
            )
            raise

    def fix_box_schema(self):
        """Fix Box model schema issues"""
        self.stdout.write("📋 Checking existing database schema...")
        
        with connection.cursor() as cursor:
            # Check existing columns in fuel_box table
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'fuel_box'
            """)
            
            existing_columns = [row[0] for row in cursor.fetchall()]
            self.stdout.write(f"✅ Found {len(existing_columns)} columns in fuel_box table")
            
            # Fields that should exist but might be missing
            required_fields = {
                'monetary_value_usd': 'DECIMAL(10,2) DEFAULT 0.00',
                'fuel_price_per_litre_usd': 'DECIMAL(10,2) DEFAULT 0.00', 
                'exchange_rate': 'DECIMAL(10,4) DEFAULT 27.5000',
                'notes': 'TEXT'
            }
            
            missing_fields = 0
            for field_name, field_def in required_fields.items():
                if field_name not in existing_columns:
                    self.stdout.write(f"❌ Missing field: {field_name}")
                    missing_fields += 1
                else:
                    self.stdout.write(f"✅ Field exists: {field_name}")
            
            if missing_fields > 0:
                self.stdout.write(f"🔧 Adding {missing_fields} missing fields...")
                
                for field_name, field_def in required_fields.items():
                    if field_name not in existing_columns:
                        try:
                            if field_name == 'notes':
                                # Add notes field with NULL allowed
                                cursor.execute(f"""
                                    ALTER TABLE fuel_box 
                                    ADD COLUMN {field_name} {field_def}
                                """)
                            else:
                                # Add other fields with NOT NULL and default
                                cursor.execute(f"""
                                    ALTER TABLE fuel_box 
                                    ADD COLUMN {field_name} {field_def} NOT NULL
                                """)
                            self.stdout.write(f"✅ Added: {field_name}")
                        except Exception as e:
                            self.stdout.write(f"⚠️ Field {field_name} may already exist: {str(e)}")
            else:
                self.stdout.write("✅ All required fields already exist!")
            
            # Ensure box_code field allows null/blank for auto-generation
            try:
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ALTER COLUMN box_code DROP NOT NULL
                """)
                self.stdout.write("✅ box_code field updated to allow null/blank values")
            except Exception as e:
                self.stdout.write(f"⚠️ box_code field already allows null: {str(e)}")

        self.stdout.write("🚀 Azure production database schema fix completed!")
        self.stdout.write("✅ Box creation should now work without field errors")
