#!/usr/bin/env python3
"""
Test embedding trực tiếp qua API endpoint mới
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
        logging.FileHandler('logs/test_direct_embedding.log', encoding='utf-8'),
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

def create_todo_and_test_direct_embedding(token):
    """Tạo todo và test embedding trực tiếp"""
    logger.info("[CREATE] Tạo todo mới...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    todo_data = {
        "title": "Test embedding trực tiếp - báo cáo AI về quản lý dự án",
        "description": "Báo cáo chi tiết về ứng dụng AI trong quản lý dự án và tự động hóa",
        "is_important": False
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/todos", json=todo_data, headers=headers)
    
    if response.status_code == 201:
        todo = response.json()
        logger.info(f"[SUCCESS] Todo created: {todo['id']}")
        logger.info(f"   Title: {todo['title']}")
        logger.info(f"   Tags: {[tag['name'] for tag in todo.get('tags', [])]}")
        
        # Test direct embedding creation
        logger.info("[EMBED] Test tạo embedding trực tiếp...")
        embed_response = requests.post(f"{BASE_URL}/api/v1/agent/todo/{todo['id']}/embed-direct", headers=headers)
        
        if embed_response.status_code == 200:
            result = embed_response.json()
            logger.info("[SUCCESS] Embedding created successfully!")
            logger.info(f"   Message: {result['message']}")
            logger.info(f"   Embedding ID: {result['embedding_id']}")
            logger.info(f"   Content: {result['content']}")
            
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
            logger.error(f"[ERROR] Direct embedding failed: {embed_response.status_code} - {embed_response.text}")
        
        return todo
    else:
        logger.error(f"[ERROR] Tạo todo thất bại: {response.status_code} - {response.text}")
        return None

def main():
    """Main test function"""
    logger.info("=" * 60)
    logger.info("TEST DIRECT EMBEDDING")
    logger.info("=" * 60)
    
    # Đăng nhập
    token = login()
    if not token:
        return
    
    # Tạo todo và test embedding trực tiếp
    create_todo_and_test_direct_embedding(token)
    
    logger.info("\n" + "=" * 60)
    logger.info("TEST HOAN THANH!")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
