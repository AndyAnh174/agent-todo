#!/usr/bin/env python3
"""
Test BGE-M3 API trực tiếp để xem format đúng
"""
import requests
import json

# Test với API URL hiện tại
api_url = "https://embed.andyanh.id.vn/embed"

def test_bge3_api():
    print("🧪 Testing BGE-M3 API...")
    print(f"API URL: {api_url}")
    
    # Test 1: Format hiện tại
    print("\n1️⃣ Test format hiện tại:")
    payload1 = {
        "texts": ["công việc khẩn cấp"],
        "max_length": 512
    }
    
    try:
        response = requests.post(
            api_url,
            headers={"Content-Type": "application/json"},
            json=payload1,
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Embedding length: {len(result.get('embeddings', [[]])[0])}")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 2: Format khác
    print("\n2️⃣ Test format khác:")
    payload2 = {
        "text": "công việc khẩn cấp",
        "max_length": 512
    }
    
    try:
        response = requests.post(
            api_url,
            headers={"Content-Type": "application/json"},
            json=payload2,
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response keys: {list(result.keys())}")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 3: Format đơn giản
    print("\n3️⃣ Test format đơn giản:")
    payload3 = {
        "texts": ["test"]
    }
    
    try:
        response = requests.post(
            api_url,
            headers={"Content-Type": "application/json"},
            json=payload3,
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response keys: {list(result.keys())}")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 4: GET request để xem API info
    print("\n4️⃣ Test GET request:")
    try:
        response = requests.get(api_url, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_bge3_api()
