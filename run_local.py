#!/usr/bin/env python3
"""
Script để chạy FastAPI server bằng uvicorn locally
"""
import os
import sys
import subprocess
import time
from pathlib import Path

def check_dependencies():
    """Kiểm tra các dependencies cần thiết"""
    print("🔍 Kiểm tra dependencies...")
    
    # Kiểm tra Python packages
    required_packages = [
        'fastapi', 'uvicorn', 'sqlalchemy', 'psycopg2-binary', 
        'pydantic', 'python-dotenv', 'PyJWT', 'passlib', 
        'redis', 'aiosmtplib', 'langchain', 'langchain-community',
        'qdrant-client', 'ollama', 'numpy', 'celery'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    if missing_packages:
        print(f"\n📦 Cần cài đặt: {', '.join(missing_packages)}")
        print("Chạy: pip install " + " ".join(missing_packages))
        return False
    
    print("✅ Tất cả dependencies đã sẵn sàng!")
    return True

def check_services():
    """Kiểm tra các services cần thiết"""
    print("\n🔍 Kiểm tra services...")
    
    # Kiểm tra PostgreSQL
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost",
            port="5432", 
            database="agent_plan",
            user="user",
            password="password"
        )
        conn.close()
        print("✅ PostgreSQL")
    except Exception as e:
        print(f"❌ PostgreSQL: {e}")
        return False
    
    # Kiểm tra Redis
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("✅ Redis")
    except Exception as e:
        print(f"❌ Redis: {e}")
        return False
    
    # Kiểm tra Qdrant
    try:
        import requests
        response = requests.get("http://localhost:6333/health", timeout=5)
        if response.status_code == 200:
            print("✅ Qdrant")
        else:
            print(f"❌ Qdrant: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Qdrant: {e}")
        return False
    
    print("✅ Tất cả services đã sẵn sàng!")
    return True

def setup_environment():
    """Setup environment variables"""
    print("\n🔧 Setup environment...")
    
    env_vars = {
        'DATABASE_URL': 'postgresql+psycopg2://user:password@localhost:5432/agent_plan',
        'REDIS_URL': 'redis://localhost:6379/0',
        'CELERY_BROKER_URL': 'redis://localhost:6379/0',
        'CELERY_RESULT_BACKEND': 'redis://localhost:6379/0',
        'OLLAMA_HOST': 'http://222.253.80.30:11434',
        'OLLAMA_MODEL': 'llama3.1:8b',
        'BGE3_API_URL': 'https://embed.andyanh.id.vn/embed',
        'QDRANT_HOST': 'localhost',
        'QDRANT_PORT': '6333',
        'QDRANT_COLLECTION': 'todo_embeddings',
        'SECRET_KEY': 'your-secret-key-here-change-in-production',
        'ALGORITHM': 'HS256',
        'ACCESS_TOKEN_EXPIRE_MINUTES': '60',
        'SMTP_HOST': 'smtp.gmail.com',
        'SMTP_PORT': '587',
        'SMTP_USERNAME': 'your-email@gmail.com',
        'SMTP_PASSWORD': 'your-app-password'
    }
    
    for key, value in env_vars.items():
        os.environ[key] = value
        print(f"✅ {key}")
    
    print("✅ Environment setup hoàn tất!")

def run_migrations():
    """Chạy database migrations"""
    print("\n🗄️ Chạy database migrations...")
    
    try:
        # Thay đổi working directory
        os.chdir(Path(__file__).parent)
        
        # Chạy alembic upgrade
        result = subprocess.run([
            sys.executable, '-m', 'alembic', 'upgrade', 'head'
        ], capture_output=True, text=True, cwd='.')
        
        if result.returncode == 0:
            print("✅ Database migrations thành công!")
        else:
            print(f"❌ Migration failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Migration error: {e}")
        return False
    
    return True

def start_server():
    """Khởi động FastAPI server"""
    print("\n🚀 Khởi động FastAPI server...")
    
    try:
        # Thay đổi working directory về server
        os.chdir(Path(__file__).parent / "server")
        
        # Chạy uvicorn
        cmd = [
            sys.executable, '-m', 'uvicorn',
            'app.main:app',
            '--host', '0.0.0.0',
            '--port', '8000',
            '--reload',
            '--log-level', 'info'
        ]
        
        print(f"Chạy lệnh: {' '.join(cmd)}")
        print("🌐 Server sẽ chạy tại: http://localhost:8000")
        print("📚 API docs tại: http://localhost:8000/docs")
        print("🛑 Nhấn Ctrl+C để dừng server")
        print("-" * 50)
        
        subprocess.run(cmd)
        
    except KeyboardInterrupt:
        print("\n🛑 Server đã dừng!")
    except Exception as e:
        print(f"❌ Lỗi khởi động server: {e}")

def main():
    """Main function"""
    print("🚀 Agent Todo - Local Development Server")
    print("=" * 50)
    
    # Kiểm tra dependencies
    if not check_dependencies():
        print("\n❌ Vui lòng cài đặt dependencies trước!")
        return
    
    # Kiểm tra services
    if not check_services():
        print("\n❌ Vui lòng khởi động các services trước!")
        print("Chạy: docker-compose -f docker-compose.minimal.yml up -d")
        return
    
    # Setup environment
    setup_environment()
    
    # Chạy migrations
    if not run_migrations():
        print("\n❌ Migration failed!")
        return
    
    # Khởi động server
    start_server()

if __name__ == "__main__":
    main()
