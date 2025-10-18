#!/usr/bin/env python3
"""
Test script để kiểm tra /task page
"""
import requests
import time

def test_task_page():
    base_url = "http://localhost:3000"
    
    try:
        # Wait a bit for dev server to start
        print("Waiting for dev server to start...")
        time.sleep(3)
        
        # Test GET /task page
        response = requests.get(
            f"{base_url}/task",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Length: {len(response.text)}")
        
        if response.status_code == 200:
            print("✅ /task page loads successfully!")
        elif response.status_code == 500:
            print("❌ Server error on /task page")
            print(f"Response: {response.text[:500]}...")
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to dev server. Is it running?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_task_page()
