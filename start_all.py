import os
import sys
import subprocess
import time
import threading
import signal
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

def start_fastapi():
    """Start FastAPI server"""
    logger.info("🚀 Starting FastAPI server...")
    try:
        # Change to server directory
        os.chdir(os.path.join(os.path.dirname(__file__), 'server'))
        
        # Start FastAPI
        subprocess.run([
            sys.executable, '-m', 'uvicorn',
            'app.main:app',
            '--host', '0.0.0.0',
            '--port', '8000',
            '--reload'
        ])
    except Exception as e:
        logger.error(f"❌ FastAPI error: {e}")

def start_celery():
    """Start Celery worker"""
    logger.info("🚀 Starting Celery worker...")
    try:
        # Change to server directory
        os.chdir(os.path.join(os.path.dirname(__file__), 'server'))
        
        # Start Celery worker
        subprocess.run([
            sys.executable, '-m', 'celery',
            '-A', 'app.celery_app',
            'worker',
            '-l', 'info',
            '--concurrency=1',
            '--pool=solo',
            '--without-gossip',
            '--without-mingle',
            '--without-heartbeat'
        ])
    except Exception as e:
        logger.error(f"❌ Celery error: {e}")

def signal_handler(sig, frame):
    """Handle Ctrl+C"""
    logger.info("\n🛑 Shutting down...")
    sys.exit(0)

def main():
    logger.info("============================================================")
    logger.info("🚀 STARTING AI AGENT TODO SYSTEM")
    logger.info("============================================================")
    logger.info("🌐 FastAPI: http://localhost:8000")
    logger.info("📚 API docs: http://localhost:8000/docs")
    logger.info("🔄 Celery worker: Running locally")
    logger.info("🛑 Press Ctrl+C to stop")
    logger.info("------------------------------------------------------------")
    
    # Set up signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start FastAPI in a separate thread
    fastapi_thread = threading.Thread(target=start_fastapi, daemon=True)
    fastapi_thread.start()
    
    # Wait a bit for FastAPI to start
    time.sleep(3)
    
    # Start Celery worker in main thread
    try:
        start_celery()
    except KeyboardInterrupt:
        logger.info("\n🛑 Shutting down...")

if __name__ == "__main__":
    main()
