#!/usr/bin/env python3
"""
Test script với user hovietanh147@gmail.com để kiểm tra Smart Logic Engine
"""

import requests
import json
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/test_user_hovietanh.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

def register_user():
    """Đăng ký user mới"""
    logger.info("[REGISTER] Đăng ký user hovietanh147@gmail.com...")
    
    user_data = {
        "email": "hovietanh147@gmail.com",
        "password": "1742005AA",
        "full_name": "Hồ Viết Anh"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user_data)
    
    if response.status_code == 201:
        logger.info("[SUCCESS] Đăng ký thành công")
        return True
    elif response.status_code == 400 and ("already exists" in response.text or "already registered" in response.text):
        logger.info("[INFO] User đã tồn tại, tiếp tục...")
        return True
    else:
        logger.error(f"[ERROR] Đăng ký thất bại: {response.status_code} - {response.text}")
        return False

def login():
    """Đăng nhập và lấy token"""
    logger.info("[LOGIN] Đăng nhập với hovietanh147@gmail.com...")
    
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

def test_smart_analysis(token):
    """Test Smart Logic Engine với các todo mẫu"""
    logger.info("[TEST] Test Smart Logic Engine...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test cases
    test_cases = [
        {
            "title": "ngày mai viết báo thuật toán của môn DSA",
            "description": "",
            "expected_tags": ["tomorrow", "study", "report", "technical"]
        },
        {
            "title": "Đi làm ở công ty ABC vào ngày mai khẩn cấp",
            "description": "Tui đi làm backend ở công ty ABC vào ngày mai",
            "expected_tags": ["urgent", "tomorrow", "work", "office", "backend"]
        },
        {
            "title": "Đi làm ở công ty ABC vào ngày mai",
            "description": "Tui đi làm backend ở công ty ABC vào ngày mai",
            "expected_tags": ["tomorrow", "work", "office", "backend"]
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        logger.info(f"\n[TEST CASE {i}] {case['title']}")
        
        # Test smart analysis endpoint
        analysis_response = requests.post(
            f"{BASE_URL}/api/v1/todos/smart/analyze",
            json={
                "title": case["title"],
                "description": case["description"]
            },
            headers=headers
        )
        
        if analysis_response.status_code == 200:
            analysis = analysis_response.json()
            logger.info(f"[ANALYSIS] Suggested tags: {analysis.get('suggested_tags', [])}")
            logger.info(f"[ANALYSIS] Priority: {analysis.get('suggested_priority')}")
            logger.info(f"[ANALYSIS] Deadline: {analysis.get('suggested_deadline')}")
            logger.info(f"[ANALYSIS] Confidence: {analysis.get('confidence')}")
        else:
            logger.error(f"[ERROR] Smart analysis failed: {analysis_response.status_code} - {analysis_response.text}")
        
        # Test tạo todo thực tế
        todo_response = requests.post(
            f"{BASE_URL}/api/v1/todos",
            json={
                "title": case["title"],
                "description": case["description"],
                "is_important": False
            },
            headers=headers
        )
        
        if todo_response.status_code == 201:
            todo = todo_response.json()
            logger.info(f"[TODO CREATED] ID: {todo['id']}")
            logger.info(f"[TODO CREATED] Tags: {todo.get('tags', [])}")
            logger.info(f"[TODO CREATED] Is Important: {todo.get('is_important')}")
            
            # So sánh với expected tags
            actual_tags = [tag['name'] for tag in todo.get('tags', [])]
            expected_tags = case['expected_tags']
            
            logger.info(f"[COMPARISON] Expected: {expected_tags}")
            logger.info(f"[COMPARISON] Actual: {actual_tags}")
            
            # Tính accuracy
            matched_tags = set(actual_tags) & set(expected_tags)
            accuracy = len(matched_tags) / len(expected_tags) if expected_tags else 0
            logger.info(f"[ACCURACY] {len(matched_tags)}/{len(expected_tags)} = {accuracy:.2%}")
            
        else:
            logger.error(f"[ERROR] Tạo todo thất bại: {todo_response.status_code} - {todo_response.text}")

def test_vector_database(token):
    """Test vector database storage"""
    logger.info("[TEST] Test vector database...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test semantic search
    search_response = requests.get(
        f"{BASE_URL}/api/v1/agent/search?query=báo cáo thuật toán&limit=5",
        headers=headers
    )
    
    if search_response.status_code == 200:
        results = search_response.json()
        logger.info(f"[VECTOR SEARCH] Found {results['total']} results")
        for result in results['results']:
            logger.info(f"  - {result['content']} (similarity: {result['similarity']:.3f})")
    else:
        logger.error(f"[ERROR] Vector search failed: {search_response.status_code} - {search_response.text}")
    
    # Test embed all
    embed_response = requests.post(
        f"{BASE_URL}/api/v1/agent/embed-all",
        json={"limit": 10},
        headers=headers
    )
    
    if embed_response.status_code == 200:
        result = embed_response.json()
        logger.info(f"[EMBED ALL] Task started: {result['task_id']}")
    else:
        logger.error(f"[ERROR] Embed all failed: {embed_response.status_code} - {embed_response.text}")

def list_user_todos(token):
    """Lấy danh sách todos của user"""
    logger.info("[LIST] Lấy danh sách todos...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/v1/todos?limit=10", headers=headers)
    
    if response.status_code == 200:
        todos = response.json()
        logger.info(f"[SUCCESS] Tìm thấy {len(todos)} todos:")
        
        for i, todo in enumerate(todos, 1):
            logger.info(f"\n   {i}. {todo['title']}")
            logger.info(f"      ID: {todo['id']}")
            logger.info(f"      Is Important: {todo.get('is_important')}")
            logger.info(f"      Tags: {[tag['name'] for tag in todo.get('tags', [])]}")
            logger.info(f"      Created: {todo.get('created_at')}")
        
        return todos
    else:
        logger.error(f"[ERROR] Lấy todos thất bại: {response.status_code} - {response.text}")
        return []

def main():
    """Main test function"""
    logger.info("=" * 60)
    logger.info("TEST USER HO VIET ANH - SMART LOGIC ENGINE")
    logger.info("=" * 60)
    
    # Đăng ký user
    if not register_user():
        return
    
    # Đăng nhập
    token = login()
    if not token:
        return
    
    # Test Smart Logic Engine
    test_smart_analysis(token)
    
    # Test Vector Database
    test_vector_database(token)
    
    # List todos
    todos = list_user_todos(token)
    
    logger.info("\n" + "=" * 60)
    logger.info("TEST HOAN THANH!")
    logger.info("=" * 60)
    
    # Tóm tắt kết quả
    logger.info("\nTOM TAT KET QUA:")
    logger.info("- Kiểm tra Smart Logic Engine có phân tích đúng keywords không")
    logger.info("- Kiểm tra vector database có lưu embeddings không")
    logger.info("- So sánh expected vs actual tags")

if __name__ == "__main__":
    main()
