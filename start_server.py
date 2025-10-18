#!/usr/bin/env python3
"""
Simple script để chạy FastAPI server với uvicorn
"""
import os
import sys
from pathlib import Path

# Setup environment variables
os.environ.update({
    'DATABASE_URL': 'postgresql+psycopg2://user:password@localhost:5432/agent_plan',
    'REDIS_URL': 'redis://localhost:6379/0',
    'CELERY_BROKER_URL': 'redis://localhost:6379/0',
    'CELERY_RESULT_BACKEND': 'redis://localhost:6379/0',
    'OLLAMA_HOST': 'http://222.253.80.30:11434',
    'OLLAMA_MODEL': 'qwen3:4b',
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
})

# Thay đổi working directory và thêm vào Python path
server_dir = Path(__file__).parent / "server"
os.chdir(server_dir)
sys.path.insert(0, str(server_dir))

# Import và chạy uvicorn
if __name__ == "__main__":
    import uvicorn
    print("🚀 Khởi động FastAPI server...")
    print("🌐 Server: http://localhost:8000")
    print("📚 API docs: http://localhost:8000/docs")
    print("🛑 Nhấn Ctrl+C để dừng")
    print("-" * 50)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
