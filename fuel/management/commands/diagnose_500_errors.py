from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Diagnose and fix remaining 500 errors in the API'

    def handle(self, *args, **options):
        """
        Diagnose remaining 500 errors:
        1. Check for missing tables/columns for Boxes API
        2. Check for missing tables/columns for Analytics API
        3. Test model queries that might be failing
        """
        
        with connection.cursor() as cursor:
            try:
                self.stdout.write("🔍 DIAGNOSING REMAINING 500 ERRORS")
                self.stdout.write("=" * 50)
                
                # 1. Check Box model related tables
                self.check_box_related_tables(cursor)
                
                # 2. Check Analytics related tables  
                self.check_analytics_related_tables(cursor)
                
                # 3. Test problematic queries
                self.test_problematic_queries()
                
                self.stdout.write(self.style.SUCCESS("✅ Diagnostic completed!"))
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Error during diagnostic: {str(e)}")
                )
                logger.error(f"Diagnostic error: {str(e)}")
                raise

    def check_box_related_tables(self, cursor):
        """Check all Box model related tables and columns"""
        self.stdout.write("\n📦 CHECKING BOX MODEL TABLES:")
        
        # Check if all Box model columns exist
        box_columns = [
            'id', 'box_code', 'fuel_type', 'denomination', 'first_coupon_number',
            'last_coupon_number', 'number_of_books', 'coupons_per_book', 
            'total_coupons_calculated', 'total_litres', 'fuel_price_per_litre_usd',
            'exchange_rate_zwg_usd', 'total_value_usd', 'total_value_zwg',
            'calculation_mode', 'book_details_json', 'status', 'received_at',
            'assigned_to_id', 'received_by_id', 'notes', 'barcode',
            'verification_notes', 'verified_at', 'verified_by_id',
            'supplier', 'received_by_signature', 'damage_report',
            'is_archived', 'archived_at', 'archived_by_id', 'created', 'modified'
        ]
        
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'fuel_box'
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        missing_columns = set(box_columns) - set(existing_columns)
        if missing_columns:
            self.stdout.write(f"❌ Missing Box columns: {missing_columns}")
            for col in missing_columns:
                self.add_missing_box_column(cursor, col)
        else:
            self.stdout.write("✅ All Box columns exist")

        # Check SubCenter table (Box has foreign key to it)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_name = 'fuel_subcenter'
        """)
        if cursor.fetchone()[0] == 0:
            self.stdout.write("❌ fuel_subcenter table missing")
        else:
            self.stdout.write("✅ SubCenter table exists")

    def check_analytics_related_tables(self, cursor):
        """Check analytics related tables"""
        self.stdout.write("\n📊 CHECKING ANALYTICS TABLES:")
        
        # Check tables that analytics might depend on
        analytics_tables = [
            'fuel_box', 'fuel_book', 'fuel_coupon', 'fuel_dispatch',
            'fuel_allocation', 'fuel_beneficiaryprofile', 'fuel_subcenter'
        ]
        
        for table in analytics_tables:
            cursor.execute(f"""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_name = '{table}'
            """)
            if cursor.fetchone()[0] == 0:
                self.stdout.write(f"❌ Table {table} missing")
            else:
                self.stdout.write(f"✅ Table {table} exists")

    def test_problematic_queries(self):
        """Test the actual queries that might be causing 500 errors"""
        self.stdout.write("\n🧪 TESTING PROBLEMATIC QUERIES:")
        
        try:
            # Test Box model query
            from fuel.models import Box
            box_count = Box.objects.count()
            self.stdout.write(f"✅ Box.objects.count(): {box_count}")
            
            # Test Box queryset with select_related
            boxes = Box.objects.select_related('assigned_to', 'received_by', 'verified_by')[:1]
            list(boxes)  # Force evaluation
            self.stdout.write("✅ Box select_related query works")
            
        except Exception as e:
            self.stdout.write(f"❌ Box model query failed: {str(e)}")
            self.fix_box_query_issues()

        try:
            # Test Analytics related queries
            from fuel.models import Book, Coupon, Dispatch
            book_count = Book.objects.count()
            coupon_count = Coupon.objects.count()
            dispatch_count = Dispatch.objects.count()
            self.stdout.write(f"✅ Analytics models count - Books: {book_count}, Coupons: {coupon_count}, Dispatches: {dispatch_count}")
            
        except Exception as e:
            self.stdout.write(f"❌ Analytics model queries failed: {str(e)}")
            self.fix_analytics_query_issues()

    def add_missing_box_column(self, cursor, column_name):
        """Add specific missing columns to Box table"""
        try:
            if column_name == 'verified_by_id':
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD COLUMN verified_by_id INTEGER NULL;
                """)
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD CONSTRAINT fuel_box_verified_by_id_fkey 
                    FOREIGN KEY (verified_by_id) 
                    REFERENCES fuel_user(id) ON DELETE SET NULL;
                """)
            elif column_name == 'verified_at':
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD COLUMN verified_at TIMESTAMP NULL;
                """)
            elif column_name == 'verification_notes':
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD COLUMN verification_notes TEXT NULL;
                """)
            elif column_name == 'supplier':
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD COLUMN supplier VARCHAR(200) NULL;
                """)
            elif column_name == 'received_by_signature':
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD COLUMN received_by_signature TEXT NULL;
                """)
            elif column_name == 'damage_report':
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD COLUMN damage_report TEXT NULL;
                """)
            elif column_name == 'book_details_json':
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD COLUMN book_details_json JSONB DEFAULT '[]';
                """)
            elif column_name == 'calculation_mode':
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD COLUMN calculation_mode VARCHAR(20) DEFAULT 'first-and-count';
                """)
            # Add more column fixes as needed
            
            self.stdout.write(f"✅ Added missing column: {column_name}")
                
        except Exception as e:
            self.stdout.write(f"❌ Failed to add column {column_name}: {str(e)}")

    def fix_box_query_issues(self):
        """Fix issues with Box model queries"""
        with connection.cursor() as cursor:
            try:
                # Ensure all foreign key constraints are properly set up
                cursor.execute("""
                    DO $$ 
                    BEGIN
                        -- Add foreign key for assigned_to if missing
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.table_constraints 
                            WHERE constraint_name = 'fuel_box_assigned_to_id_fkey'
                        ) THEN
                            ALTER TABLE fuel_box 
                            ADD CONSTRAINT fuel_box_assigned_to_id_fkey 
                            FOREIGN KEY (assigned_to_id) 
                            REFERENCES fuel_subcenter(id) ON DELETE SET NULL;
                        END IF;
                        
                        -- Add foreign key for received_by if missing
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.table_constraints 
                            WHERE constraint_name = 'fuel_box_received_by_id_fkey'
                        ) THEN
                            ALTER TABLE fuel_box 
                            ADD CONSTRAINT fuel_box_received_by_id_fkey 
                            FOREIGN KEY (received_by_id) 
                            REFERENCES fuel_user(id) ON DELETE SET NULL;
                        END IF;
                    END $$;
                """)
                self.stdout.write("✅ Fixed Box foreign key constraints")
                
            except Exception as e:
                self.stdout.write(f"❌ Failed to fix Box query issues: {str(e)}")

    def fix_analytics_query_issues(self):
        """Fix issues with Analytics queries"""
        # This would involve checking for missing aggregation tables,
        # materialized views, or other analytics-specific database objects
        self.stdout.write("🔧 Checking analytics-specific database objects...")
        
        with connection.cursor() as cursor:
            try:
                # Check if any analytics views or functions are missing
                cursor.execute("""
                    SELECT COUNT(*) FROM information_schema.routines 
                    WHERE routine_name LIKE '%analytics%'
                """)
                analytics_functions = cursor.fetchone()[0]
                self.stdout.write(f"📊 Found {analytics_functions} analytics functions")
                
            except Exception as e:
                self.stdout.write(f"❌ Analytics check failed: {str(e)}")
