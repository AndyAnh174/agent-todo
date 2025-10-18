import os
import sys
import subprocess
import time

# Add the server directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'server')))

# Set environment variables for local execution
os.environ['DATABASE_URL'] = 'postgresql+psycopg2://user:password@localhost:5432/agent_plan'
os.environ['REDIS_URL'] = 'redis://localhost:6379/0'
os.environ['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
os.environ['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'
os.environ['OLLAMA_HOST'] = 'http://222.253.80.30:11434'
os.environ['BGE3_API_URL'] = 'https://embed.andyanh.id.vn/embed'
os.environ['QDRANT_HOST'] = 'localhost'
os.environ['QDRANT_PORT'] = '6333'
os.environ['QDRANT_COLLECTION'] = 'todo_embeddings'

print("🚀 Starting Celery worker (simple mode)...")
print("📁 Working directory: D:\\Freelance\\agent-todo\\server")
print("🔧 Environment variables set")
print("⏳ Starting worker...")
print("🛑 Nhấn Ctrl+C để dừng")
print("--------------------------------------------------")

try:
    # Change to server directory
    os.chdir(os.path.join(os.path.dirname(__file__), 'server'))
    
    # Run Celery worker with minimal configuration
    subprocess.run([
        sys.executable, '-m', 'celery',
        '-A', 'app.celery_app',
        'worker',
        '-l', 'info',
        '--concurrency=1',
        '--pool=solo',  # Use solo pool for Windows
        '--without-gossip',
        '--without-mingle',
        '--without-heartbeat'
    ])
except KeyboardInterrupt:
    print("\n🛑 Celery worker đã dừng.")
except Exception as e:
    print(f"❌ Lỗi khi khởi động Celery worker: {e}")
