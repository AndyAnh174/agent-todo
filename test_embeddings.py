#!/usr/bin/env python3
"""
Test script để tạo embeddings cho todos và test semantic search
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"
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

def create_embeddings(token):
    """Tạo embeddings cho tất cả todos"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        print("🔄 Đang tạo embeddings cho todos...")
        response = requests.post(EMBED_ALL_ENDPOINT, headers=headers)
        response.raise_for_status()
        result = response.json()
        print(f"✅ {result['message']}")
        print(f"📋 Task ID: {result['task_id']}")
        return True
    except Exception as e:
        print(f"❌ Tạo embeddings thất bại: {e}")
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
        "báo cáo tài chính",
        "mua sắm"
    ]
    
    print("\n🔍 Test Semantic Search:")
    print("-" * 30)
    
    for query in search_queries:
        try:
            print(f"\n🔎 Tìm kiếm: '{query}'")
            response = requests.get(f"{SEARCH_ENDPOINT}?query={query}&limit=3", headers=headers)
            response.raise_for_status()
            results = response.json()
            
            if results.get('results'):
                print(f"✅ Tìm thấy {results['total']} kết quả:")
                for i, result in enumerate(results['results'], 1):
                    print(f"   {i}. {result.get('content', 'N/A')[:50]}...")
                    print(f"      Độ tương đồng: {result.get('similarity', 0):.3f}")
            else:
                print("❌ Không tìm thấy kết quả")
                
        except Exception as e:
            print(f"❌ Lỗi tìm kiếm: {e}")

def main():
    print("🚀 TEST EMBEDDINGS VÀ SEMANTIC SEARCH")
    print("=" * 50)
    
    # 1. Đăng nhập
    token = login()
    if not token:
        return
    
    # 2. Tạo embeddings
    if create_embeddings(token):
        print("\n⏳ Đợi 10 giây để embeddings được tạo...")
        time.sleep(10)
        
        # 3. Test semantic search
        test_semantic_search(token)
    
    print("\n" + "=" * 50)
    print("🏁 TEST HOÀN THÀNH!")

if __name__ == "__main__":
    main()
