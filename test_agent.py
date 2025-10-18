#!/usr/bin/env python3
"""
Test script for AI Agent Chat functionality
"""
import requests
import json
import time
import logging
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"
CHAT_ENDPOINT = f"{BASE_URL}/api/v1/agent/chat"

# Setup logging
def setup_logging():
    """Setup logging to file"""
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"agent_test_{timestamp}.log")
    
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler()  # Also print to console
        ]
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized. Log file: {log_file}")
    return logger, log_file

def login(logger):
    """Login and get access token"""
    login_data = {
        "email": "agent@test.com",
        "password": "agent123"
    }
    
    logger.info("🔐 Starting login process...")
    logger.debug(f"Login data: {login_data}")
    logger.debug(f"Login endpoint: {LOGIN_ENDPOINT}")
    
    try:
        response = requests.post(LOGIN_ENDPOINT, json=login_data)
        logger.debug(f"Login response status: {response.status_code}")
        logger.debug(f"Login response headers: {dict(response.headers)}")
        
        response.raise_for_status()
        token_data = response.json()
        token = token_data["access_token"]
        
        logger.info(f"✅ Login successful! Token length: {len(token)}")
        logger.debug(f"Token preview: {token[:20]}...")
        return token
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Login failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response status: {e.response.status_code}")
            logger.error(f"Response text: {e.response.text}")
        return None

def test_agent_chat(token, message, session_id=None, logger=None):
    """Test agent chat functionality"""
    if session_id is None:
        session_id = f"test-session-{int(time.time())}"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    chat_data = {
        "message": message,
        "session_id": session_id
    }
    
    logger.info(f"🤖 Testing agent chat with message: '{message}'")
    logger.info(f"📝 Session ID: {session_id}")
    logger.debug(f"Chat data: {chat_data}")
    logger.debug(f"Headers: {headers}")
    logger.debug(f"Chat endpoint: {CHAT_ENDPOINT}")
    
    try:
        response = requests.post(CHAT_ENDPOINT, json=chat_data, headers=headers)
        logger.debug(f"Chat response status: {response.status_code}")
        logger.debug(f"Chat response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            logger.info("✅ Agent response received:")
            logger.info(f"   Response: {result.get('response', 'No response')}")
            logger.info(f"   Session ID: {result.get('session_id', 'No session ID')}")
            logger.info(f"   User ID: {result.get('user_id', 'No user ID')}")
            logger.info(f"   Timestamp: {result.get('timestamp', 'No timestamp')}")
            logger.debug(f"Full response: {result}")
            return True
        else:
            logger.error(f"❌ Chat failed with status {response.status_code}")
            logger.error(f"Response text: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Chat request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response status: {e.response.status_code}")
            logger.error(f"Response text: {e.response.text}")
        return False

def test_health_check(logger):
    """Test API health"""
    logger.info("🏥 Testing agent health check...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/agent/health")
        logger.debug(f"Health check response status: {response.status_code}")
        
        if response.status_code == 200:
            health_data = response.json()
            logger.info("🏥 Agent Health Check:")
            logger.info(f"   Status: {health_data.get('status', 'Unknown')}")
            logger.info(f"   Components: {health_data.get('components', {})}")
            logger.info(f"   Message: {health_data.get('message', 'No message')}")
            logger.debug(f"Full health data: {health_data}")
            return True
        else:
            logger.error(f"❌ Health check failed: {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Health check request failed: {e}")
        return False

def main():
    """Main test function"""
    # Setup logging
    logger, log_file = setup_logging()
    
    logger.info("🚀 Starting AI Agent Test Suite")
    logger.info("=" * 50)
    
    # Test 1: Health Check
    logger.info("\n1️⃣ Testing Agent Health Check...")
    test_health_check(logger)
    
    # Test 2: Login
    logger.info("\n2️⃣ Testing Login...")
    token = login(logger)
    if not token:
        logger.error("❌ Cannot proceed without valid token")
        return
    
    # Test 3: Simple Chat
    logger.info("\n3️⃣ Testing Simple Chat...")
    test_agent_chat(token, "Xin chào", "test-session-1", logger)
    
    # Test 4: Todo Creation Request
    logger.info("\n4️⃣ Testing Todo Creation Request...")
    test_agent_chat(token, "Bạn có thể giúp tôi tạo một todo mới không?", "test-session-2", logger)
    
    # Test 5: Schedule Query
    logger.info("\n5️⃣ Testing Schedule Query...")
    test_agent_chat(token, "Lịch của tôi hôm nay như thế nào?", "test-session-3", logger)
    
    logger.info("\n" + "=" * 50)
    logger.info("🏁 Test Suite Completed!")
    logger.info(f"📄 Detailed logs saved to: {log_file}")

if __name__ == "__main__":
    main()
