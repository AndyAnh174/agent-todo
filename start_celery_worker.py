#!/usr/bin/env python3
"""
Khởi động Celery worker với đúng configuration
"""

import os
import sys
import subprocess

# Set environment variables
os.environ['DATABASE_URL'] = 'postgresql+psycopg2://user:password@localhost:5432/agent_plan'
os.environ['REDIS_URL'] = 'redis://localhost:6379/0'
os.environ['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
os.environ['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'
os.environ['OLLAMA_HOST'] = 'http://222.253.80.30:11434'
os.environ['OLLAMA_MODEL'] = 'llama3.1:8b'
os.environ['BGE3_API_URL'] = 'https://embed.andyanh.id.vn/embed'
os.environ['QDRANT_HOST'] = 'localhost'
os.environ['QDRANT_PORT'] = '6333'
os.environ['QDRANT_COLLECTION'] = 'todo_embeddings'

# Change to server directory
os.chdir('server')

print("🚀 Starting Celery worker...")
print("📁 Working directory:", os.getcwd())
print("🔧 Environment variables set")
print("⏳ Starting worker...")

try:
    # Run Celery worker with proper configuration
    subprocess.run([
        'celery', '-A', 'app.celery_app', 'worker', 
        '-l', 'info',
        '--concurrency=1',
        '--queues=celery,embeddings,notifications'
    ], check=True)
    
except KeyboardInterrupt:
    print("\n🛑 Stopping Celery worker...")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
