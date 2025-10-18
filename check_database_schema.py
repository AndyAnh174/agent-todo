#!/usr/bin/env python3
"""
Script để kiểm tra cấu trúc database và relationships
"""

import requests
import json
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/check_database_schema.log', encoding='utf-8'),
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

def check_todo_with_tags(token):
    """Kiểm tra todo có tags"""
    logger.info("[CHECK] Kiểm tra todo có tags...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Lấy danh sách todos
    response = requests.get(f"{BASE_URL}/api/v1/todos?limit=10", headers=headers)
    
    if response.status_code == 200:
        todos = response.json()
        logger.info(f"[SUCCESS] Tìm thấy {len(todos)} todos:")
        
        for i, todo in enumerate(todos, 1):
            logger.info(f"\n   {i}. {todo['title']}")
            logger.info(f"      ID: {todo['id']}")
            logger.info(f"      User ID: {todo.get('user_id')}")
            logger.info(f"      Group ID: {todo.get('group_id')}")
            logger.info(f"      Is Completed: {todo.get('is_completed')}")
            logger.info(f"      Is Important: {todo.get('is_important')}")
            logger.info(f"      Created At: {todo.get('created_at')}")
            logger.info(f"      Updated At: {todo.get('updated_at')}")
            
            # Kiểm tra tags
            tags = todo.get('tags', [])
            logger.info(f"      Tags Count: {len(tags)}")
            if tags:
                logger.info("      Tags Details:")
                for tag in tags:
                    logger.info(f"         - {tag['name']} (ID: {tag['id']})")
            else:
                logger.info("      (Không có tags)")
        
        return todos
    else:
        logger.error(f"[ERROR] Lấy danh sách todos thất bại: {response.status_code} - {response.text}")
        return []

def check_specific_todo(token, todo_id):
    """Kiểm tra chi tiết một todo"""
    logger.info(f"[DETAIL] Kiểm tra chi tiết todo {todo_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/v1/todos/{todo_id}", headers=headers)
    
    if response.status_code == 200:
        todo = response.json()
        logger.info("[SUCCESS] Todo details:")
        logger.info(f"   Title: {todo['title']}")
        logger.info(f"   Description: {todo.get('description', 'N/A')}")
        logger.info(f"   Due Time: {todo.get('due_time', 'N/A')}")
        logger.info(f"   Is Completed: {todo.get('is_completed')}")
        logger.info(f"   Is Important: {todo.get('is_important')}")
        logger.info(f"   User ID: {todo.get('user_id')}")
        logger.info(f"   Group ID: {todo.get('group_id')}")
        logger.info(f"   Created At: {todo.get('created_at')}")
        logger.info(f"   Updated At: {todo.get('updated_at')}")
        
        # Tags details
        tags = todo.get('tags', [])
        logger.info(f"   Tags Count: {len(tags)}")
        if tags:
            logger.info("   Tags Details:")
            for tag in tags:
                logger.info(f"      - {tag['name']} (ID: {tag['id']})")
                logger.info(f"        Created: {tag.get('created_at')}")
                logger.info(f"        Updated: {tag.get('updated_at')}")
        else:
            logger.info("   (Không có tags)")
        
        return todo
    else:
        logger.error(f"[ERROR] Lấy todo thất bại: {response.status_code} - {response.text}")
        return None

def explain_database_design():
    """Giải thích thiết kế database"""
    logger.info("\n" + "="*60)
    logger.info("GIẢI THÍCH THIẾT KẾ DATABASE")
    logger.info("="*60)
    
    logger.info("\n1. TẠI SAO KHÔNG CÓ TRƯỜNG 'tags' TRONG BẢNG 'todos'?")
    logger.info("   - Đây là thiết kế Many-to-Many relationship")
    logger.info("   - Một todo có thể có nhiều tags")
    logger.info("   - Một tag có thể được dùng cho nhiều todos")
    logger.info("   - Tránh duplicate data và tăng flexibility")
    
    logger.info("\n2. CẤU TRÚC DATABASE:")
    logger.info("   - Bảng 'todos': Chứa thông tin cơ bản của todo")
    logger.info("   - Bảng 'tags': Chứa thông tin các tags")
    logger.info("   - Bảng 'todo_tag': Liên kết giữa todos và tags")
    
    logger.info("\n3. KHI NÀO TAGS XUẤT HIỆN?")
    logger.info("   - Trong API response (JSON)")
    logger.info("   - Khi query với SQLAlchemy ORM")
    logger.info("   - Không có trong database table 'todos' trực tiếp")
    
    logger.info("\n4. LỢI ÍCH CỦA THIẾT KẾ NÀY:")
    logger.info("   - Normalization: Tránh duplicate data")
    logger.info("   - Flexibility: Dễ thêm metadata cho tags")
    logger.info("   - Performance: Query tags riêng biệt")
    logger.info("   - Scalability: Hỗ trợ nhiều relationships")

def main():
    """Main function"""
    logger.info("="*60)
    logger.info("KIỂM TRA CẤU TRÚC DATABASE VÀ TAGS")
    logger.info("="*60)
    
    # Đăng nhập
    token = login()
    if not token:
        return
    
    # Giải thích thiết kế
    explain_database_design()
    
    # Kiểm tra todos
    logger.info("\n[TEST] Kiểm tra todos và tags...")
    todos = check_todo_with_tags(token)
    
    if todos:
        # Kiểm tra todo đầu tiên chi tiết
        first_todo = todos[0]
        check_specific_todo(token, first_todo['id'])
    
    logger.info("\n" + "="*60)
    logger.info("KẾT LUẬN:")
    logger.info("- Tags KHÔNG có trong bảng 'todos' trực tiếp")
    logger.info("- Tags được lưu trong bảng 'tags' riêng biệt")
    logger.info("- Liên kết thông qua bảng 'todo_tag'")
    logger.info("- Xuất hiện trong API response nhờ SQLAlchemy ORM")
    logger.info("="*60)

if __name__ == "__main__":
    main()
