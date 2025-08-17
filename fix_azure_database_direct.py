#!/usr/bin/env python3
"""
Direct Database Fix for Azure 500 Errors
========================================

This script connects directly to the Azure PostgreSQL database
and fixes the missing category_multiplier column issue.

Run this if you can't deploy through Azure CLI.
"""

import os
import psycopg2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration from production.py
DATABASE_CONFIG = {
    'host': 'parliament-fuel-postgres.postgres.database.azure.com',
    'database': 'parliament-fuel-postgres',
    'user': 'parliament_admin',
    'password': 'Parliament2024!',  # Update this if different
    'port': 5432,
    'sslmode': 'require'
}

def test_database_connection():
    """Test the database connection"""
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor()
        
        # Test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        logger.info(f"✅ Database connection successful")
        logger.info(f"   PostgreSQL version: {version[0]}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def check_column_exists():
    """Check if category_multiplier column exists"""
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor()
        
        # Check for column existence
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'fuel_beneficiarycategory'
            AND column_name = 'category_multiplier'
        """)
        
        result = cursor.fetchone()
        
        if result:
            logger.info(f"✅ Column category_multiplier exists: {result}")
            cursor.close()
            conn.close()
            return True
        else:
            logger.warning("⚠️ Column category_multiplier does NOT exist")
            cursor.close()
            conn.close()
            return False
            
    except Exception as e:
        logger.error(f"❌ Error checking column: {e}")
        return False

def add_missing_column():
    """Add the missing category_multiplier column"""
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor()
        
        # Add the missing column
        logger.info("🔧 Adding category_multiplier column...")
        cursor.execute("""
            ALTER TABLE fuel_beneficiarycategory 
            ADD COLUMN IF NOT EXISTS category_multiplier DECIMAL(5,2) DEFAULT 1.0
        """)
        
        # Commit the change
        conn.commit()
        logger.info("✅ Column added successfully")
        
        # Verify the column was added
        cursor.execute("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'fuel_beneficiarycategory'
            AND column_name = 'category_multiplier'
        """)
        
        result = cursor.fetchone()
        if result:
            logger.info(f"✅ Verification: {result}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Error adding column: {e}")
        return False

def check_table_structure():
    """Check the full table structure"""
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor()
        
        # Get all columns for the table
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'fuel_beneficiarycategory'
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        
        logger.info("📋 BeneficiaryCategory table structure:")
        for col in columns:
            logger.info(f"   - {col[0]} ({col[1]}) {'NULL' if col[2] == 'YES' else 'NOT NULL'} {col[3] or ''}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Error checking table structure: {e}")
        return False

def main():
    """Main function"""
    logger.info("=" * 60)
    logger.info("AZURE DATABASE FIX - Parliament Fuel System")
    logger.info("=" * 60)
    
    # Step 1: Test connection
    logger.info("Step 1: Testing database connection...")
    if not test_database_connection():
        logger.error("Cannot connect to database. Check your credentials.")
        return False
    
    # Step 2: Check current table structure
    logger.info("\nStep 2: Checking table structure...")
    check_table_structure()
    
    # Step 3: Check if column exists
    logger.info("\nStep 3: Checking for missing column...")
    if check_column_exists():
        logger.info("✅ Column already exists. No fix needed.")
    else:
        # Step 4: Add the missing column
        logger.info("\nStep 4: Adding missing column...")
        if add_missing_column():
            logger.info("✅ Database fix completed successfully!")
        else:
            logger.error("❌ Database fix failed!")
            return False
    
    # Step 5: Final verification
    logger.info("\nStep 5: Final verification...")
    check_table_structure()
    
    logger.info("\n" + "=" * 60)
    logger.info("DATABASE FIX COMPLETED!")
    logger.info("Now redeploy your application to Azure App Service.")
    logger.info("=" * 60)
    
    return True

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\nOperation cancelled by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
