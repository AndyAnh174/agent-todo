#!/usr/bin/env python3
"""
Test script để kiểm tra todos có trả về tags không
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"
TODOS_ENDPOINT = f"{BASE_URL}/api/v1/todos"

def login():
    """Đăng nhập và lấy token"""
    login_data = {
        "email": "agent@test.com",
        "password": "agent123"
    }
    
    try:
        response = requests.post(LOGIN_ENDPOINT, json=login_data)
        response.raise_for_status()
        token_data = response.json()
        return token_data["access_token"]
    except Exception as e:
        print(f"Login failed: {e}")
        return None

def create_todo_with_tags(token):
    """Tạo todo với tags để test"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Tạo todo với tags
    todo_data = {
        "title": "Test todo với tags",
        "description": "Đây là todo test để kiểm tra tags",
        "tag_ids": []  # Sẽ được tạo bởi Smart Logic Engine
    }
    
    try:
        print("📝 Tạo todo với tags...")
        response = requests.post(TODOS_ENDPOINT, json=todo_data, headers=headers)
        response.raise_for_status()
        todo = response.json()
        print(f"✅ Todo created: {todo['id']}")
        print(f"   Title: {todo['title']}")
        print(f"   Tags: {todo.get('tags', [])}")
        return todo
    except Exception as e:
        print(f"❌ Lỗi tạo todo: {e}")
        return None

def get_todos(token):
    """Lấy danh sách todos và kiểm tra tags"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        print("\n📋 Lấy danh sách todos...")
        response = requests.get(TODOS_ENDPOINT, headers=headers)
        response.raise_for_status()
        todos = response.json()
        
        print(f"✅ Tìm thấy {len(todos)} todos:")
        for i, todo in enumerate(todos, 1):
            print(f"\n   {i}. {todo['title']}")
            print(f"      ID: {todo['id']}")
            print(f"      Tags: {todo.get('tags', [])}")
            if todo.get('tags'):
                for tag in todo['tags']:
                    print(f"         - {tag.get('name', 'N/A')} (ID: {tag.get('id', 'N/A')})")
            else:
                print("         (Không có tags)")
        
        return todos
    except Exception as e:
        print(f"❌ Lỗi lấy todos: {e}")
        return []

def get_single_todo(token, todo_id):
    """Lấy một todo cụ thể và kiểm tra tags"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"\n🔍 Lấy todo {todo_id}...")
        response = requests.get(f"{TODOS_ENDPOINT}/{todo_id}", headers=headers)
        response.raise_for_status()
        todo = response.json()
        
        print(f"✅ Todo details:")
        print(f"   Title: {todo['title']}")
        print(f"   Description: {todo.get('description', 'N/A')}")
        print(f"   Tags: {todo.get('tags', [])}")
        if todo.get('tags'):
            for tag in todo['tags']:
                print(f"      - {tag.get('name', 'N/A')} (ID: {tag.get('id', 'N/A')})")
        else:
            print("      (Không có tags)")
        
        return todo
    except Exception as e:
        print(f"❌ Lỗi lấy todo: {e}")
        return None

def main():
    print("🚀 TEST TODOS VỚI TAGS")
    print("=" * 50)
    
    # 1. Đăng nhập
    token = login()
    if not token:
        return
    
    # 2. Tạo todo với tags
    new_todo = create_todo_with_tags(token)
    
    # 3. Lấy danh sách todos
    todos = get_todos(token)
    
    # 4. Lấy todo cụ thể nếu có
    if todos:
        first_todo = todos[0]
        get_single_todo(token, first_todo['id'])
    
    print("\n" + "=" * 50)
    print("🏁 TEST HOÀN THÀNH!")
    print("\n📊 Kết quả:")
    print("- Nếu thấy 'Tags: []' hoặc '(Không có tags)' → Tags chưa được trả về")
    print("- Nếu thấy 'Tags: [{'id': '...', 'name': '...'}]' → Tags đã được trả về thành công!")

if __name__ == "__main__":
    main()
