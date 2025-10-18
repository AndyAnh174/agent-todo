#!/usr/bin/env python3
"""
Test script để kiểm tra embedding creation
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
        logging.FileHandler('logs/test_embedding_creation.log', encoding='utf-8'),
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

def create_todo_with_embedding(token):
    """Tạo todo mới và kiểm tra embedding"""
    logger.info("[CREATE] Tạo todo mới để test embedding...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    todo_data = {
        "title": "Test embedding creation - viết báo cáo AI",
        "description": "Báo cáo về ứng dụng AI trong quản lý dự án",
        "is_important": False
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/todos", json=todo_data, headers=headers)
    
    if response.status_code == 201:
        todo = response.json()
        logger.info(f"[SUCCESS] Todo created: {todo['id']}")
        logger.info(f"   Title: {todo['title']}")
        logger.info(f"   Tags: {[tag['name'] for tag in todo.get('tags', [])]}")
        return todo
    else:
        logger.error(f"[ERROR] Tạo todo thất bại: {response.status_code} - {response.text}")
        return None

def test_embedding_creation(token, todo_id):
    """Test tạo embedding cho todo"""
    logger.info(f"[EMBED] Test tạo embedding cho todo {todo_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test manual embedding creation
    response = requests.post(f"{BASE_URL}/api/v1/agent/todo/{todo_id}/embed", headers=headers)
    
    if response.status_code == 202:
        logger.info("[SUCCESS] Embedding task started")
        return True
    else:
        logger.error(f"[ERROR] Embedding creation failed: {response.status_code} - {response.text}")
        return False

def test_semantic_search(token, query):
    """Test semantic search"""
    logger.info(f"[SEARCH] Test semantic search với query: '{query}'...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Chờ một chút để embedding được tạo
    logger.info("[WAIT] Chờ 10 giây để embedding được tạo...")
    time.sleep(10)
    
    response = requests.get(f"{BASE_URL}/api/v1/agent/search?query={query}&limit=5", headers=headers)
    
    if response.status_code == 200:
        results = response.json()
        logger.info(f"[SUCCESS] Tìm thấy {results['total']} results")
        for i, result in enumerate(results['results'], 1):
            logger.info(f"   {i}. {result['content']} (similarity: {result['similarity']:.3f})")
        return results
    else:
        logger.error(f"[ERROR] Semantic search failed: {response.status_code} - {response.text}")
        return None

def test_embed_all(token):
    """Test embed all todos"""
    logger.info("[EMBED ALL] Test embed all todos...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(f"{BASE_URL}/api/v1/agent/embed-all", json={"limit": 10}, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        logger.info(f"[SUCCESS] Embed all task started: {result['task_id']}")
        return result
    else:
        logger.error(f"[ERROR] Embed all failed: {response.status_code} - {response.text}")
        return None

def main():
    """Main test function"""
    logger.info("=" * 60)
    logger.info("TEST EMBEDDING CREATION")
    logger.info("=" * 60)
    
    # Đăng nhập
    token = login()
    if not token:
        return
    
    # Tạo todo mới
    todo = create_todo_with_embedding(token)
    if not todo:
        return
    
    todo_id = todo['id']
    
    # Test manual embedding creation
    test_embedding_creation(token, todo_id)
    
    # Test semantic search
    test_semantic_search(token, "báo cáo AI")
    
    # Test embed all
    test_embed_all(token)
    
    # Test semantic search sau embed all
    logger.info("\n[SEARCH AGAIN] Test semantic search sau embed all...")
    time.sleep(15)  # Chờ embed all hoàn thành
    test_semantic_search(token, "báo cáo AI")
    
    logger.info("\n" + "=" * 60)
    logger.info("TEST HOAN THANH!")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
