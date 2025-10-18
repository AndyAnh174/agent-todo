#!/usr/bin/env python3
"""
Test Celery tasks trực tiếp
"""

import sys
import os
sys.path.append('server')

from app.tasks.embedding_tasks import create_todo_embedding_task, batch_create_embeddings_task
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_celery_tasks():
    """Test Celery tasks trực tiếp"""
    logger.info("🧪 Testing Celery tasks directly...")
    
    try:
        # Test create_todo_embedding_task
        logger.info("📝 Testing create_todo_embedding_task...")
        result = create_todo_embedding_task.delay("test-todo-123")
        logger.info(f"   Task ID: {result.id}")
        logger.info(f"   Status: {result.status}")
        
        # Test batch_create_embeddings_task
        logger.info("📝 Testing batch_create_embeddings_task...")
        result2 = batch_create_embeddings_task.delay("test-user-123", 10)
        logger.info(f"   Task ID: {result2.id}")
        logger.info(f"   Status: {result2.status}")
        
        logger.info("✅ Tasks submitted successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        return False

def main():
    """Main test function"""
    logger.info("=" * 60)
    logger.info("TEST CELERY TASKS DIRECTLY")
    logger.info("=" * 60)
    
    success = test_celery_tasks()
    
    if success:
        logger.info("\n" + "=" * 60)
        logger.info("✅ CELERY TASKS WORKING!")
        logger.info("=" * 60)
    else:
        logger.info("\n" + "=" * 60)
        logger.info("❌ CELERY TASKS FAILED!")
        logger.info("=" * 60)

if __name__ == "__main__":
    main()
