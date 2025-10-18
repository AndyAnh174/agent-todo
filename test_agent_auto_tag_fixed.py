#!/usr/bin/env python3
"""
Test script để kiểm tra chức năng gán tags tự động qua AI Agent (Fixed Unicode)
"""

import requests
import json
import logging
from datetime import datetime

# Setup logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/test_agent_auto_tag_fixed.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

def login():
    """Đăng nhập và lấy token"""
    logger.info("[LOGIN] Đăng nhập...")
    
    login_data = {
        "email": "agent@test.com",
        "password": "agent123"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        logger.info("[SUCCESS] Đăng nhập thành công")
        return token
    else:
        logger.error(f"[ERROR] Đăng nhập thất bại: {response.status_code} - {response.text}")
        return None

def create_todo_without_tags(token):
    """Tạo todo không có tags để test auto-tag"""
    logger.info("[CREATE] Tạo todo không có tags...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    todo_data = {
        "title": "Viết báo cáo tháng 11 khẩn cấp",
        "description": "Báo cáo tài chính và kế hoạch cho tháng 11, cần hoàn thành trước ngày 30/11",
        "is_important": False  # Để test smart analysis
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/todos", json=todo_data, headers=headers)
    
    if response.status_code == 201:
        todo = response.json()
        logger.info(f"[SUCCESS] Todo created: {todo['id']}")
        logger.info(f"   Title: {todo['title']}")
        logger.info(f"   Tags: {todo.get('tags', [])}")
        return todo
    else:
        logger.error(f"[ERROR] Tạo todo thất bại: {response.status_code} - {response.text}")
        return None

def test_agent_auto_tag(token, todo_id):
    """Test Agent gán tags tự động"""
    logger.info(f"[AGENT] Test Agent gán tags tự động cho todo {todo_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Chat với agent để gán tags tự động
    chat_data = {
        "message": f"Bạn hãy gán tags tự động cho todo có ID {todo_id}",
        "session_id": "test_auto_tag_session"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/agent/chat", json=chat_data, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        logger.info("[SUCCESS] Agent response:")
        logger.info(f"   Response: {result['response']}")
        return result
    else:
        logger.error(f"[ERROR] Agent chat thất bại: {response.status_code} - {response.text}")
        return None

def check_todo_tags(token, todo_id):
    """Kiểm tra tags của todo sau khi agent gán"""
    logger.info(f"[CHECK] Kiểm tra tags của todo {todo_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/v1/todos/{todo_id}", headers=headers)
    
    if response.status_code == 200:
        todo = response.json()
        logger.info("[SUCCESS] Todo details:")
        logger.info(f"   Title: {todo['title']}")
        logger.info(f"   Tags: {todo.get('tags', [])}")
        
        if todo.get('tags'):
            logger.info("   Tag details:")
            for tag in todo['tags']:
                logger.info(f"      - {tag['name']} (ID: {tag['id']})")
        else:
            logger.info("   (Không có tags)")
        
        return todo
    else:
        logger.error(f"[ERROR] Lấy todo thất bại: {response.status_code} - {response.text}")
        return None

def test_agent_create_todo_with_auto_tags(token):
    """Test Agent tạo todo mới với auto tags"""
    logger.info("[AGENT] Test Agent tạo todo mới với auto tags...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Chat với agent để tạo todo mới
    chat_data = {
        "message": "Tạo todo mới: Họp team review code vào thứ 2 tuần sau lúc 2h chiều",
        "session_id": "test_create_todo_session"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/agent/chat", json=chat_data, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        logger.info("[SUCCESS] Agent response:")
        logger.info(f"   Response: {result['response']}")
        return result
    else:
        logger.error(f"[ERROR] Agent chat thất bại: {response.status_code} - {response.text}")
        return None

def list_recent_todos(token):
    """Lấy danh sách todos gần đây để kiểm tra"""
    logger.info("[LIST] Lấy danh sách todos gần đây...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/v1/todos?limit=5", headers=headers)
    
    if response.status_code == 200:
        todos = response.json()
        logger.info(f"[SUCCESS] Tìm thấy {len(todos)} todos:")
        
        for i, todo in enumerate(todos, 1):
            logger.info(f"   {i}. {todo['title']}")
            logger.info(f"      ID: {todo['id']}")
            logger.info(f"      Tags: {todo.get('tags', [])}")
            if todo.get('tags'):
                for tag in todo['tags']:
                    logger.info(f"         - {tag['name']} (ID: {tag['id']})")
            else:
                logger.info("         (Không có tags)")
            logger.info("")
        
        return todos
    else:
        logger.error(f"[ERROR] Lấy danh sách todos thất bại: {response.status_code} - {response.text}")
        return []

def main():
    """Main test function"""
    logger.info("=" * 60)
    logger.info("TEST AGENT AUTO TAG (FIXED UNICODE)")
    logger.info("=" * 60)
    
    # Đăng nhập
    token = login()
    if not token:
        return
    
    # Test 1: Tạo todo không có tags
    logger.info("\n[TEST 1] Tạo todo không có tags")
    todo = create_todo_without_tags(token)
    if not todo:
        return
    
    todo_id = todo['id']
    
    # Test 2: Agent gán tags tự động cho todo hiện có
    logger.info("\n[TEST 2] Agent gán tags tự động")
    agent_result = test_agent_auto_tag(token, todo_id)
    if not agent_result:
        return
    
    # Test 3: Kiểm tra tags sau khi agent gán
    logger.info("\n[TEST 3] Kiểm tra tags sau khi agent gán")
    updated_todo = check_todo_tags(token, todo_id)
    
    # Test 4: Agent tạo todo mới với auto tags
    logger.info("\n[TEST 4] Agent tạo todo mới với auto tags")
    create_result = test_agent_create_todo_with_auto_tags(token)
    
    # Test 5: Kiểm tra tất cả todos gần đây
    logger.info("\n[TEST 5] Kiểm tra tất cả todos gần đây")
    recent_todos = list_recent_todos(token)
    
    logger.info("\n" + "=" * 60)
    logger.info("TEST HOAN THANH!")
    
    # Tóm tắt kết quả
    logger.info("\nTOM TAT KET QUA:")
    logger.info("- Nếu thấy tags được gán tự động -> Chức năng hoạt động tốt")
    logger.info("- Nếu không thấy tags -> Cần kiểm tra Smart Logic Engine")
    logger.info("- Nếu Agent không phản hồi -> Cần kiểm tra LangChain Agent")

if __name__ == "__main__":
    main()
