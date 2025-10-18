#!/usr/bin/env python3
"""
Demo script để test các tính năng NLP của AI Agent
"""
import requests
import json
import time
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"
CHAT_ENDPOINT = f"{BASE_URL}/api/v1/agent/chat"
SEARCH_ENDPOINT = f"{BASE_URL}/api/v1/agent/search"
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
        logger.error(f"Login failed: {e}")
        return None

def chat_with_agent(token, message, session_id="demo-session"):
    """Chat với agent"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    chat_data = {
        "message": message,
        "session_id": session_id
    }
    
    try:
        response = requests.post(CHAT_ENDPOINT, json=chat_data, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        return None

def semantic_search(token, query):
    """Tìm kiếm ngữ nghĩa"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{SEARCH_ENDPOINT}?query={query}&limit=5", headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return None

def create_todo_via_api(token, todo_data):
    """Tạo todo qua API để test smart logic"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(TODOS_ENDPOINT, json=todo_data, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Create todo failed: {e}")
        return None

def demo_nlp_features():
    """Demo các tính năng NLP"""
    print("🚀 DEMO AI AGENT VỚI NLP")
    print("=" * 50)
    
    # 1. Đăng nhập
    print("\n1️⃣ Đăng nhập...")
    token = login()
    if not token:
        print("❌ Không thể đăng nhập")
        return
    print("✅ Đăng nhập thành công")
    
    # 2. Test Smart Logic Engine - Tạo todos với ngôn ngữ tự nhiên
    print("\n2️⃣ Test Smart Logic Engine - Tạo todos thông minh...")
    
    test_todos = [
        {
            "title": "Viết báo cáo tháng 10 khẩn cấp",
            "description": "Báo cáo tài chính quý 3 cần hoàn thành gấp"
        },
        {
            "title": "Họp team vào thứ 2 tuần sau lúc 9h sáng",
            "description": "Thảo luận về dự án mới"
        },
        {
            "title": "Mua sắm đồ dùng học tập cho con",
            "description": "Sách vở, bút chì, tẩy cho năm học mới"
        },
        {
            "title": "Làm bài tập toán khó",
            "description": "Giải các bài toán tích phân và đạo hàm"
        }
    ]
    
    created_todos = []
    for todo in test_todos:
        print(f"\n📝 Tạo todo: '{todo['title']}'")
        result = create_todo_via_api(token, todo)
        if result:
            created_todos.append(result)
            print(f"✅ Đã tạo todo ID: {result['id']}")
            print(f"   - Độ ưu tiên: {'Cao' if result.get('is_important') else 'Bình thường'}")
            print(f"   - Deadline: {result.get('due_time', 'Chưa đặt')}")
        else:
            print("❌ Tạo todo thất bại")
    
    # 3. Test Conversational Interface
    print("\n3️⃣ Test Conversational Interface...")
    
    conversation_examples = [
        "Xin chào, bạn có thể giúp tôi quản lý công việc không?",
        "Tôi muốn tạo một todo mới: 'Gọi điện cho khách hàng vào chiều nay'",
        "Lịch của tôi hôm nay như thế nào?",
        "Bạn có thể tìm giúp tôi các công việc liên quan đến báo cáo không?",
        "Tôi có rảnh vào thứ 3 tuần này không?"
    ]
    
    for i, message in enumerate(conversation_examples, 1):
        print(f"\n💬 Câu hỏi {i}: {message}")
        response = chat_with_agent(token, message, f"demo-session-{i}")
        if response:
            print(f"🤖 Agent: {response['response']}")
        else:
            print("❌ Không nhận được phản hồi")
        
        time.sleep(1)  # Nghỉ 1 giây giữa các câu hỏi
    
    # 4. Test Semantic Search
    print("\n4️⃣ Test Semantic Search...")
    
    search_queries = [
        "công việc khẩn cấp",
        "học tập",
        "họp hành",
        "báo cáo tài chính"
    ]
    
    for query in search_queries:
        print(f"\n🔍 Tìm kiếm: '{query}'")
        results = semantic_search(token, query)
        if results and results.get('results'):
            print(f"✅ Tìm thấy {results['total']} kết quả:")
            for result in results['results'][:3]:  # Hiển thị top 3
                print(f"   - {result.get('content', 'N/A')} (Độ tương đồng: {result.get('similarity', 0):.2f})")
        else:
            print("❌ Không tìm thấy kết quả")
    
    # 5. Test Smart Analysis
    print("\n5️⃣ Test Smart Analysis...")
    
    analysis_message = "Phân tích cho tôi các todos hiện tại và đưa ra gợi ý tối ưu"
    print(f"💬 Yêu cầu: {analysis_message}")
    response = chat_with_agent(token, analysis_message, "analysis-session")
    if response:
        print(f"🤖 Agent phân tích: {response['response']}")
    else:
        print("❌ Không nhận được phân tích")
    
    print("\n" + "=" * 50)
    print("🏁 DEMO HOÀN THÀNH!")
    print(f"📊 Đã tạo {len(created_todos)} todos để test")
    print("🎯 Các tính năng NLP đã được demo:")
    print("   - Smart Logic Engine (phân tích thông minh)")
    print("   - Conversational Interface (giao tiếp tự nhiên)")
    print("   - Semantic Search (tìm kiếm ngữ nghĩa)")
    print("   - Context Awareness (hiểu ngữ cảnh)")

if __name__ == "__main__":
    demo_nlp_features()
