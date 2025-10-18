#!/usr/bin/env python3
"""
Script để fix embeddings và test semantic search
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"
TODOS_ENDPOINT = f"{BASE_URL}/api/v1/todos"
EMBED_ALL_ENDPOINT = f"{BASE_URL}/api/v1/agent/embed-all"
SEARCH_ENDPOINT = f"{BASE_URL}/api/v1/agent/search"

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

def get_user_todos(token):
    """Lấy danh sách todos của user"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(TODOS_ENDPOINT, headers=headers)
        response.raise_for_status()
        todos = response.json()
        print(f"📋 User có {len(todos)} todos:")
        for i, todo in enumerate(todos, 1):
            print(f"   {i}. {todo['title']} (ID: {todo['id']})")
        return todos
    except Exception as e:
        print(f"❌ Lỗi lấy todos: {e}")
        return []

def create_embeddings(token):
    """Tạo embeddings cho tất cả todos"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        print("\n🔄 Tạo embeddings cho todos...")
        response = requests.post(EMBED_ALL_ENDPOINT, headers=headers)
        response.raise_for_status()
        result = response.json()
        print(f"✅ {result['message']}")
        print(f"📋 Task ID: {result['task_id']}")
        return True
    except Exception as e:
        print(f"❌ Lỗi tạo embeddings: {e}")
        return False

def test_semantic_search(token):
    """Test semantic search"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    search_queries = [
        "công việc khẩn cấp",
        "học tập",
        "họp hành", 
        "báo cáo",
        "mua sắm"
    ]
    
    print("\n🔍 Test Semantic Search:")
    print("-" * 30)
    
    for query in search_queries:
        try:
            print(f"\n🔎 Tìm kiếm: '{query}'")
            response = requests.get(f"{SEARCH_ENDPOINT}?query={query}&limit=3", headers=headers)
            
            if response.status_code == 200:
                results = response.json()
                print(f"✅ Tìm thấy {results['total']} kết quả:")
                
                if results['results']:
                    for i, result in enumerate(results['results'], 1):
                        print(f"   {i}. {result.get('content', 'N/A')[:50]}...")
                        print(f"      Độ tương đồng: {result.get('similarity', 0):.3f}")
                else:
                    print("   (Không có kết quả)")
            else:
                print(f"❌ Lỗi: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")

def main():
    print("🚀 FIX EMBEDDINGS VÀ TEST SEMANTIC SEARCH")
    print("=" * 60)
    
    # 1. Đăng nhập
    token = login()
    if not token:
        return
    
    # 2. Kiểm tra todos hiện có
    todos = get_user_todos(token)
    if not todos:
        print("❌ Không có todos để tạo embeddings")
        return
    
    # 3. Tạo embeddings
    if create_embeddings(token):
        print("\n⏳ Đợi 15 giây để embeddings được tạo...")
        time.sleep(15)
        
        # 4. Test semantic search
        test_semantic_search(token)
    
    print("\n" + "=" * 60)
    print("🏁 HOÀN THÀNH!")

if __name__ == "__main__":
    main()
