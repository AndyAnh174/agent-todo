#!/usr/bin/env python3
"""
Test embedding service trực tiếp
"""

import sys
import os
sys.path.append('server')

from app.services.embedding_service import get_embedding_service
from app.services.vector_service import get_vector_service
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_embedding_service():
    """Test embedding service"""
    logger.info("🧪 Testing BGE3 Embedding Service...")
    
    try:
        embedding_service = get_embedding_service()
        
        # Test health check
        logger.info("🔍 Testing health check...")
        is_healthy = embedding_service.health_check()
        logger.info(f"   Health: {'✅ Healthy' if is_healthy else '❌ Unhealthy'}")
        
        # Test encode text
        logger.info("📝 Testing encode text...")
        test_text = "viết báo cáo AI về quản lý dự án"
        embedding = embedding_service.encode_text(test_text)
        logger.info(f"   Text: '{test_text}'")
        logger.info(f"   Embedding length: {len(embedding)}")
        logger.info(f"   First 5 values: {embedding[:5]}")
        logger.info(f"   All zeros: {all(x == 0.0 for x in embedding)}")
        
        return embedding_service
        
    except Exception as e:
        logger.error(f"❌ Embedding service error: {e}")
        return None

def test_vector_service():
    """Test vector service"""
    logger.info("🧪 Testing Qdrant Vector Service...")
    
    try:
        vector_service = get_vector_service()
        
        # Test add embedding
        logger.info("📝 Testing add embedding...")
        test_todo_id = "test-todo-123"
        test_content = "viết báo cáo AI về quản lý dự án"
        test_metadata = {
            "user_id": "test-user-123",
            "title": "Test todo",
            "is_completed": False
        }
        
        result = vector_service.add_todo_embedding(test_todo_id, test_content, test_metadata)
        logger.info(f"   Result: {result}")
        
        # Test search
        logger.info("🔍 Testing search...")
        search_results = vector_service.search_similar_todos("báo cáo AI", "test-user-123", limit=5)
        logger.info(f"   Search results: {len(search_results)}")
        for i, result in enumerate(search_results):
            logger.info(f"     {i+1}. {result['content']} (similarity: {result['similarity']:.3f})")
        
        return vector_service
        
    except Exception as e:
        logger.error(f"❌ Vector service error: {e}")
        return None

def main():
    """Main test function"""
    logger.info("=" * 60)
    logger.info("TEST EMBEDDING SERVICES DIRECTLY")
    logger.info("=" * 60)
    
    # Test embedding service
    embedding_service = test_embedding_service()
    if not embedding_service:
        logger.error("❌ Embedding service failed")
        return
    
    # Test vector service
    vector_service = test_vector_service()
    if not vector_service:
        logger.error("❌ Vector service failed")
        return
    
    logger.info("\n" + "=" * 60)
    logger.info("✅ ALL TESTS PASSED!")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
