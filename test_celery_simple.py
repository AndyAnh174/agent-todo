import os
import sys
import time
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

def test_celery_worker():
    logger.info("============================================================")
    logger.info("TEST CELERY WORKER SIMPLE")
    logger.info("============================================================")
    
    try:
        from app.celery_app import celery_app
        from app.tasks.embedding_tasks import create_todo_embedding_task
        
        logger.info("✅ Celery app imported successfully")
        logger.info(f"✅ Broker: {celery_app.conf.broker_url}")
        logger.info(f"✅ Backend: {celery_app.conf.result_backend}")
        
        # Test task submission
        test_todo_id = "test-todo-123"
        logger.info(f"📝 Submitting task for todo: {test_todo_id}")
        
        task = create_todo_embedding_task.delay(test_todo_id)
        logger.info(f"✅ Task submitted: {task.id}")
        logger.info(f"✅ Task status: {task.status}")
        
        # Wait a bit and check status
        time.sleep(2)
        logger.info(f"✅ Task status after 2s: {task.status}")
        
        if task.status == 'SUCCESS':
            logger.info("🎉 Task completed successfully!")
        elif task.status == 'FAILURE':
            logger.error(f"❌ Task failed: {task.result}")
        else:
            logger.info(f"⏳ Task still running: {task.status}")
            
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_celery_worker()
