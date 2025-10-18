#!/usr/bin/env python3
"""
Script to start the FastAPI server with proper configuration
"""
import subprocess
import sys
import os
from pathlib import Path

def main():
    # Get the project root directory
    project_root = Path(__file__).parent
    server_dir = project_root / "server"
    
    # Change to server directory
    os.chdir(server_dir)
    
    print("🚀 Starting Agent TODO Server...")
    print(f"📁 Working directory: {server_dir}")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API docs will be available at: http://localhost:8000/docs")
    print("🔧 Health check: http://localhost:8000/health")
    print("-" * 50)
    
    try:
        # Start the server using uvicorn
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload",
            "--log-level", "info"
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()