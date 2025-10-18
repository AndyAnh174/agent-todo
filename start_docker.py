import os
import sys
import subprocess
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_docker():
    """Check if Docker is running"""
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"✅ Docker: {result.stdout.strip()}")
            return True
        else:
            logger.error("❌ Docker not found")
            return False
    except FileNotFoundError:
        logger.error("❌ Docker not installed")
        return False

def check_docker_compose():
    """Check if Docker Compose is available"""
    try:
        result = subprocess.run(['docker-compose', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"✅ Docker Compose: {result.stdout.strip()}")
            return True
        else:
            logger.error("❌ Docker Compose not found")
            return False
    except FileNotFoundError:
        logger.error("❌ Docker Compose not installed")
        return False

def start_services():
    """Start Docker services"""
    logger.info("🚀 Starting Docker services...")
    
    # Stop any existing containers
    logger.info("🛑 Stopping existing containers...")
    subprocess.run(['docker-compose', '-f', 'docker-compose.minimal.yml', 'down'], 
                   capture_output=True)
    
    # Start services
    logger.info("🚀 Starting services...")
    result = subprocess.run([
        'docker-compose', '-f', 'docker-compose.minimal.yml', 'up', '--build', '-d'
    ])
    
    if result.returncode == 0:
        logger.info("✅ Services started successfully!")
        return True
    else:
        logger.error("❌ Failed to start services")
        return False

def check_services():
    """Check if services are running"""
    logger.info("🔍 Checking service status...")
    
    # Check containers
    result = subprocess.run(['docker-compose', '-f', 'docker-compose.minimal.yml', 'ps'], 
                           capture_output=True, text=True)
    
    if result.returncode == 0:
        logger.info("📊 Service Status:")
        print(result.stdout)
        
        # Check if all services are up
        lines = result.stdout.strip().split('\n')
        services = [line for line in lines if 'agent-todo' in line and 'Up' in line]
        
        if len(services) >= 4:  # db, redis, qdrant, celery-worker
            logger.info("✅ All services are running!")
            return True
        else:
            logger.warning("⚠️ Some services may not be running")
            return False
    else:
        logger.error("❌ Failed to check service status")
        return False

def show_logs():
    """Show logs for debugging"""
    logger.info("📋 Showing recent logs...")
    
    # Show celery worker logs
    logger.info("🔄 Celery Worker Logs:")
    subprocess.run(['docker-compose', '-f', 'docker-compose.minimal.yml', 'logs', '--tail=10', 'celery-worker'])
    
    # Show qdrant logs
    logger.info("🗄️ Qdrant Logs:")
    subprocess.run(['docker-compose', '-f', 'docker-compose.minimal.yml', 'logs', '--tail=5', 'qdrant'])

def main():
    logger.info("============================================================")
    logger.info("🐳 DOCKER AI AGENT TODO SYSTEM")
    logger.info("============================================================")
    
    # Check prerequisites
    if not check_docker():
        logger.error("Please install Docker first!")
        return
    
    if not check_docker_compose():
        logger.error("Please install Docker Compose first!")
        return
    
    # Start services
    if not start_services():
        logger.error("Failed to start services!")
        return
    
    # Wait a bit for services to start
    logger.info("⏳ Waiting for services to start...")
    time.sleep(10)
    
    # Check services
    if check_services():
        logger.info("🎉 All services are running!")
        logger.info("🌐 FastAPI: http://localhost:8000")
        logger.info("📚 API docs: http://localhost:8000/docs")
        logger.info("🔄 Celery worker: Running in Docker")
        logger.info("🗄️ Qdrant: http://localhost:6333")
        logger.info("📊 Redis: localhost:6379")
        logger.info("🗃️ PostgreSQL: localhost:5432")
        logger.info("")
        logger.info("🛑 To stop: docker-compose -f docker-compose.minimal.yml down")
        logger.info("📋 To see logs: docker-compose -f docker-compose.minimal.yml logs -f")
    else:
        logger.error("❌ Some services failed to start!")
        show_logs()

if __name__ == "__main__":
    main()
