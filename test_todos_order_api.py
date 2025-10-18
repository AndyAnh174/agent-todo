#!/usr/bin/env python3
"""
Test script để kiểm tra API endpoint /todos/order
"""
import requests
import json

def test_todos_order_api():
    base_url = "http://localhost:8000"
    
    # Test data
    test_todo_ids = ["test-id-1", "test-id-2", "test-id-3"]
    
    try:
        # Test PUT /todos/order endpoint
        response = requests.put(
            f"{base_url}/api/v1/todos/order",
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer test-token"
            },
            json=test_todo_ids,
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("✅ API endpoint exists but requires authentication (expected)")
        elif response.status_code == 404:
            print("❌ API endpoint not found")
        elif response.status_code == 422:
            print("❌ Validation error")
        else:
            print(f"✅ API endpoint responded with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_todos_order_api()
