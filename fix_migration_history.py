import psycopg2
import subprocess
import os
import sys
from urllib.parse import urlparse

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is not set")
    sys.exit(1)

# Parse database URL
url = urlparse(DATABASE_URL)
DB_NAME = url.path[1:]  # Remove leading slash
DB_USER = url.username
DB_PASSWORD = url.password
DB_HOST = url.hostname
DB_PORT = url.port or '5432'

print(f"Using database: {DB_HOST}/{DB_NAME} as user {DB_USER}")

def fix_migration_history():
    print("Connecting to database...")
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        sslmode="require"
    )
    cur = conn.cursor()

    try:
        # Show current migrations
        print("\nCurrent migrations:")
        cur.execute("""
            SELECT app, name, applied 
            FROM django_migrations 
            WHERE app = 'fuel' 
            ORDER BY applied;
        """)
        for row in cur.fetchall():
            print(f"{row[0]}.{row[1]} - {row[2]}")

        # Delete problematic migration row
        print("\nDeleting migration: fuel.0023_fix_coupon_distribution_and_session_attendance")
        cur.execute("""
            DELETE FROM django_migrations
            WHERE app = 'fuel' AND name = '0023_fix_coupon_distribution_and_session_attendance';
        """)
        conn.commit()

        print("\nRemaining migrations after deletion:")
        cur.execute("""
            SELECT app, name, applied 
            FROM django_migrations 
            WHERE app = 'fuel' 
            ORDER BY applied;
        """)
        for row in cur.fetchall():
            print(f"{row[0]}.{row[1]} - {row[2]}")

    finally:
        cur.close()
        conn.close()
        print("\nDatabase connection closed.")

    # Run Django management commands
    print("\nFaking merge migration...")
    subprocess.run([
        "python", "manage.py", "migrate", "fuel", "10002_merge_20250811_1736", "--fake", "--settings=config.settings.production"
    ], check=True)

    print("\nFaking dependent migration...")
    subprocess.run([
        "python", "manage.py", "migrate", "fuel", "0023_fix_coupon_distribution_and_session_attendance", "--fake", "--settings=config.settings.production"
    ], check=True)

    print("\nRunning all migrations...")
    subprocess.run([
        "python", "manage.py", "migrate", "--settings=config.settings.production"
    ], check=True)

    print("\nMigration history fix completed.")

if __name__ == "__main__":
    fix_migration_history()
