#!/usr/bin/env python3
"""
Test script để kiểm tra API endpoint /todos
"""
import requests
import json

def test_todos_api():
    base_url = "http://localhost:8000"
    
    try:
        # Test GET /todos endpoint
        response = requests.get(
            f"{base_url}/api/v1/todos",
            headers={
                "Authorization": "Bearer test-token"
            },
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 401:
            print("✅ API endpoint exists but requires authentication (expected)")
        elif response.status_code == 500:
            print("❌ Server error - check database connection")
        elif response.status_code == 404:
            print("❌ API endpoint not found")
        else:
            print(f"✅ API endpoint responded with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_todos_api()
