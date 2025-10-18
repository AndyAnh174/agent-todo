#!/usr/bin/env python3
"""
Test embedding trực tiếp không qua Celery
"""

import requests
import json
import logging
import time

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/test_simple_embedding.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

def login():
    """Đăng nhập và lấy token"""
    logger.info("[LOGIN] Đăng nhập...")
    
    login_data = {
        "email": "hovietanh147@gmail.com",
        "password": "1742005AA"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        logger.info("[SUCCESS] Đăng nhập thành công")
        return token
    else:
        logger.error(f"[ERROR] Đăng nhập thất bại: {response.status_code} - {response.text}")
        return None

def create_todo_and_test_embedding(token):
    """Tạo todo và test embedding trực tiếp"""
    logger.info("[CREATE] Tạo todo mới...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    todo_data = {
        "title": "Test embedding trực tiếp - báo cáo AI",
        "description": "Báo cáo về ứng dụng AI trong quản lý dự án",
        "is_important": False
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/todos", json=todo_data, headers=headers)
    
    if response.status_code == 201:
        todo = response.json()
        logger.info(f"[SUCCESS] Todo created: {todo['id']}")
        logger.info(f"   Title: {todo['title']}")
        logger.info(f"   Tags: {[tag['name'] for tag in todo.get('tags', [])]}")
        
        # Test manual embedding creation
        logger.info("[EMBED] Test tạo embedding manual...")
        embed_response = requests.post(f"{BASE_URL}/api/v1/agent/todo/{todo['id']}/embed", headers=headers)
        
        if embed_response.status_code == 202:
            logger.info("[SUCCESS] Embedding task started")
            
            # Chờ và test search
            logger.info("[WAIT] Chờ 15 giây để embedding được tạo...")
            time.sleep(15)
            
            # Test semantic search
            logger.info("[SEARCH] Test semantic search...")
            search_response = requests.get(f"{BASE_URL}/api/v1/agent/search?query=báo cáo AI&limit=5", headers=headers)
            
            if search_response.status_code == 200:
                results = search_response.json()
                logger.info(f"[SUCCESS] Tìm thấy {results['total']} results")
                for i, result in enumerate(results['results'], 1):
                    logger.info(f"   {i}. {result['content']} (similarity: {result['similarity']:.3f})")
            else:
                logger.error(f"[ERROR] Search failed: {search_response.status_code} - {search_response.text}")
        else:
            logger.error(f"[ERROR] Embedding creation failed: {embed_response.status_code} - {embed_response.text}")
        
        return todo
    else:
        logger.error(f"[ERROR] Tạo todo thất bại: {response.status_code} - {response.text}")
        return None

def main():
    """Main test function"""
    logger.info("=" * 60)
    logger.info("TEST SIMPLE EMBEDDING")
    logger.info("=" * 60)
    
    # Đăng nhập
    token = login()
    if not token:
        return
    
    # Tạo todo và test embedding
    create_todo_and_test_embedding(token)
    
    logger.info("\n" + "=" * 60)
    logger.info("TEST HOAN THANH!")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
