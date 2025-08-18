from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Fix missing database columns for SessionAttendance and Box models'

    def handle(self, *args, **options):
        """
        Add missing columns to fix the database schema issues:
        1. SessionAttendance.date
        2. Box.verified_by_id
        """
        
        with connection.cursor() as cursor:
            try:
                # Check if SessionAttendance.date column exists
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='fuel_sessionattendance' 
                    AND column_name='date'
                """)
                date_exists = cursor.fetchone()
                
                if not date_exists:
                    self.stdout.write("Adding 'date' column to fuel_sessionattendance...")
                    cursor.execute("""
                        ALTER TABLE fuel_sessionattendance 
                        ADD COLUMN date DATE DEFAULT CURRENT_DATE;
                    """)
                    
                    # Create index on date column
                    cursor.execute("""
                        CREATE INDEX IF NOT EXISTS fuel_sessionattendance_date_idx 
                        ON fuel_sessionattendance(date);
                    """)
                    self.stdout.write(self.style.SUCCESS("✓ Added 'date' column to SessionAttendance"))
                else:
                    self.stdout.write("✓ SessionAttendance.date column already exists")

                # Check if Box.verified_by_id column exists
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='fuel_box' 
                    AND column_name='verified_by_id'
                """)
                verified_by_exists = cursor.fetchone()
                
                if not verified_by_exists:
                    self.stdout.write("Adding 'verified_by_id' column to fuel_box...")
                    cursor.execute("""
                        ALTER TABLE fuel_box 
                        ADD COLUMN verified_by_id INTEGER NULL;
                    """)
                    
                    # Add foreign key constraint
                    cursor.execute("""
                        ALTER TABLE fuel_box 
                        ADD CONSTRAINT fuel_box_verified_by_id_fkey 
                        FOREIGN KEY (verified_by_id) 
                        REFERENCES fuel_user(id) 
                        ON DELETE SET NULL;
                    """)
                    self.stdout.write(self.style.SUCCESS("✓ Added 'verified_by_id' column to Box"))
                else:
                    self.stdout.write("✓ Box.verified_by_id column already exists")
                
                # Check for any other missing columns from recent migrations
                self.check_other_missing_columns(cursor)
                
                self.stdout.write(self.style.SUCCESS("Database schema fix completed successfully!"))
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error fixing database schema: {str(e)}")
                )
                logger.error(f"Database schema fix error: {str(e)}")
                raise

    def check_other_missing_columns(self, cursor):
        """Check for other potentially missing columns"""
        
        # Check if Box.verified_at exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='fuel_box' 
            AND column_name='verified_at'
        """)
        verified_at_exists = cursor.fetchone()
        
        if not verified_at_exists:
            self.stdout.write("Adding 'verified_at' column to fuel_box...")
            cursor.execute("""
                ALTER TABLE fuel_box 
                ADD COLUMN verified_at TIMESTAMP NULL;
            """)
            self.stdout.write(self.style.SUCCESS("✓ Added 'verified_at' column to Box"))

        # Check if Box.verification_notes exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='fuel_box' 
            AND column_name='verification_notes'
        """)
        verification_notes_exists = cursor.fetchone()
        
        if not verification_notes_exists:
            self.stdout.write("Adding 'verification_notes' column to fuel_box...")
            cursor.execute("""
                ALTER TABLE fuel_box 
                ADD COLUMN verification_notes TEXT NULL;
            """)
            self.stdout.write(self.style.SUCCESS("✓ Added 'verification_notes' column to Box"))
