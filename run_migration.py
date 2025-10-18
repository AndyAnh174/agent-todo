#!/usr/bin/env python3
"""
Script để chạy migration thêm order_index column
"""
import os
import sys
import subprocess

def run_migration():
    try:
        # Set environment variables
        os.environ['PYTHONPATH'] = 'server'
        
        # Run migration
        result = subprocess.run([
            'alembic', 'upgrade', 'head'
        ], capture_output=True, text=True, timeout=30)
        
        print("Migration output:")
        print(result.stdout)
        
        if result.stderr:
            print("Migration errors:")
            print(result.stderr)
            
        if result.returncode == 0:
            print("✅ Migration completed successfully!")
        else:
            print(f"❌ Migration failed with return code {result.returncode}")
            
    except subprocess.TimeoutExpired:
        print("❌ Migration timed out")
    except Exception as e:
        print(f"❌ Error running migration: {e}")

if __name__ == "__main__":
    run_migration()
