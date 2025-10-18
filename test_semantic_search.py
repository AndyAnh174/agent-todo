#!/usr/bin/env python3
"""
Test semantic search với logging chi tiết
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"
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

def test_semantic_search(token):
    """Test semantic search với logging chi tiết"""
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
    
    print("🔍 Test Semantic Search với logging chi tiết:")
    print("-" * 50)
    
    for query in search_queries:
        try:
            print(f"\n🔎 Tìm kiếm: '{query}'")
            response = requests.get(f"{SEARCH_ENDPOINT}?query={query}&limit=3", headers=headers)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                results = response.json()
                print(f"   ✅ Thành công! Tìm thấy {results['total']} kết quả")
                
                if results['results']:
                    for i, result in enumerate(results['results'], 1):
                        print(f"      {i}. {result.get('content', 'N/A')[:60]}...")
                        print(f"         Độ tương đồng: {result.get('similarity', 0):.3f}")
                else:
                    print("      (Không có kết quả)")
            else:
                print(f"   ❌ Lỗi: {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"   ❌ Exception: {e}")

def main():
    print("🚀 TEST SEMANTIC SEARCH CHI TIẾT")
    print("=" * 50)
    
    # 1. Đăng nhập
    token = login()
    if not token:
        return
    
    # 2. Test semantic search
    test_semantic_search(token)
    
    print("\n" + "=" * 50)
    print("🏁 TEST HOÀN THÀNH!")

if __name__ == "__main__":
    main()
