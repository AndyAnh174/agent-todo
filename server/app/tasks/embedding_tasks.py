from celery import current_task
from typing import List, Dict, Any
import logging
from sqlalchemy.orm import Session
from datetime import datetime

from ..db import get_db
from ..models.todo import Todo
from ..services.vector_service import get_vector_service
from ..services.embedding_service import get_embedding_service
from .notification_tasks import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="create_todo_embedding")
def create_todo_embedding_task(self, todo_id: str):
    """
    Tạo embedding cho todo mới
    """
    try:
        # Lấy database session
        db = next(get_db())
        
        # Lấy todo
        todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not todo:
            logger.error(f"Todo {todo_id} not found")
            return {"status": "error", "message": "Todo not found"}
        
        # Tạo content cho embedding
        content = f"{todo.title}"
        if todo.description:
            content += f" {todo.description}"
        
        # Metadata
        metadata = {
            "user_id": str(todo.user_id),
            "title": todo.title,
            "due_time": todo.due_time.isoformat() if todo.due_time else None,
            "is_important": todo.is_important,
            "is_completed": todo.is_completed,
            "group_id": str(todo.group_id) if todo.group_id else None,
            "created_at": todo.created_at.isoformat() if todo.created_at else None
        }
        
        # Tạo embedding
        vector_service = get_vector_service()
        point_id = vector_service.add_todo_embedding(
            todo_id=str(todo.id),
            content=content,
            metadata=metadata
        )
        
        logger.info(f"Created embedding for todo {todo_id}, point_id: {point_id}")
        
        return {
            "status": "success",
            "todo_id": todo_id,
            "point_id": point_id,
            "message": "Embedding created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating embedding for todo {todo_id}: {e}")
        return {
            "status": "error",
            "todo_id": todo_id,
            "message": f"Failed to create embedding: {e}"
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="update_todo_embedding")
def update_todo_embedding_task(self, todo_id: str):
    """
    Cập nhật embedding cho todo đã thay đổi
    """
    try:
        # Lấy database session
        db = next(get_db())
        
        # Lấy todo
        todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not todo:
            logger.error(f"Todo {todo_id} not found")
            return {"status": "error", "message": "Todo not found"}
        
        # Tạo content mới cho embedding
        content = f"{todo.title}"
        if todo.description:
            content += f" {todo.description}"
        
        # Metadata mới
        metadata = {
            "user_id": str(todo.user_id),
            "title": todo.title,
            "due_time": todo.due_time.isoformat() if todo.due_time else None,
            "is_important": todo.is_important,
            "is_completed": todo.is_completed,
            "group_id": str(todo.group_id) if todo.group_id else None,
            "updated_at": datetime.now().isoformat()
        }
        
        # Cập nhật embedding
        vector_service = get_vector_service()
        point_id = vector_service.update_todo_embedding(
            todo_id=str(todo.id),
            content=content,
            metadata=metadata
        )
        
        logger.info(f"Updated embedding for todo {todo_id}, point_id: {point_id}")
        
        return {
            "status": "success",
            "todo_id": todo_id,
            "point_id": point_id,
            "message": "Embedding updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating embedding for todo {todo_id}: {e}")
        return {
            "status": "error",
            "todo_id": todo_id,
            "message": f"Failed to update embedding: {e}"
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="delete_todo_embedding")
def delete_todo_embedding_task(self, todo_id: str):
    """
    Xóa embedding của todo
    """
    try:
        vector_service = get_vector_service()
        success = vector_service.delete_todo_embedding(todo_id)
        
        if success:
            logger.info(f"Deleted embedding for todo {todo_id}")
            return {
                "status": "success",
                "todo_id": todo_id,
                "message": "Embedding deleted successfully"
            }
        else:
            logger.warning(f"Failed to delete embedding for todo {todo_id}")
            return {
                "status": "warning",
                "todo_id": todo_id,
                "message": "Embedding not found or already deleted"
            }
        
    except Exception as e:
        logger.error(f"Error deleting embedding for todo {todo_id}: {e}")
        return {
            "status": "error",
            "todo_id": todo_id,
            "message": f"Failed to delete embedding: {e}"
        }


@celery_app.task(bind=True, name="batch_create_embeddings")
def batch_create_embeddings_task(self, user_id: str, limit: int = 100):
    """
    Tạo embeddings cho tất cả todos của user (bulk operation)
    """
    try:
        # Lấy database session
        db = next(get_db())
        
        # Lấy todos của user
        todos = db.query(Todo).filter(Todo.user_id == user_id).limit(limit).all()
        
        if not todos:
            logger.info(f"No todos found for user {user_id}")
            return {
                "status": "success",
                "user_id": user_id,
                "processed": 0,
                "message": "No todos to process"
            }
        
        # Chuẩn bị data cho batch processing
        embeddings_data = []
        for todo in todos:
            content = f"{todo.title}"
            if todo.description:
                content += f" {todo.description}"
            
            metadata = {
                "user_id": str(todo.user_id),
                "title": todo.title,
                "due_time": todo.due_time.isoformat() if todo.due_time else None,
                "is_important": todo.is_important,
                "is_completed": todo.is_completed,
                "group_id": str(todo.group_id) if todo.group_id else None,
                "created_at": todo.created_at.isoformat() if todo.created_at else None
            }
            
            embeddings_data.append({
                "todo_id": str(todo.id),
                "content": content,
                "metadata": metadata
            })
        
        # Batch create embeddings
        vector_service = get_vector_service()
        point_ids = vector_service.batch_add_embeddings(embeddings_data)
        
        logger.info(f"Batch created {len(point_ids)} embeddings for user {user_id}")
        
        return {
            "status": "success",
            "user_id": user_id,
            "processed": len(point_ids),
            "point_ids": point_ids,
            "message": f"Successfully created {len(point_ids)} embeddings"
        }
        
    except Exception as e:
        logger.error(f"Error in batch create embeddings for user {user_id}: {e}")
        return {
            "status": "error",
            "user_id": user_id,
            "message": f"Failed to create batch embeddings: {e}"
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="recreate_all_embeddings")
def recreate_all_embeddings_task(self):
    """
    Tạo lại tất cả embeddings (admin task)
    """
    try:
        # Lấy database session
        db = next(get_db())
        
        # Lấy tất cả todos
        todos = db.query(Todo).all()
        
        if not todos:
            logger.info("No todos found in database")
            return {
                "status": "success",
                "processed": 0,
                "message": "No todos to process"
            }
        
        # Xóa tất cả embeddings cũ
        vector_service = get_vector_service()
        # Note: Cần implement method để clear collection
        
        # Tạo lại embeddings
        embeddings_data = []
        for todo in todos:
            content = f"{todo.title}"
            if todo.description:
                content += f" {todo.description}"
            
            metadata = {
                "user_id": str(todo.user_id),
                "title": todo.title,
                "due_time": todo.due_time.isoformat() if todo.due_time else None,
                "is_important": todo.is_important,
                "is_completed": todo.is_completed,
                "group_id": str(todo.group_id) if todo.group_id else None,
                "created_at": todo.created_at.isoformat() if todo.created_at else None
            }
            
            embeddings_data.append({
                "todo_id": str(todo.id),
                "content": content,
                "metadata": metadata
            })
        
        # Batch create embeddings
        point_ids = vector_service.batch_add_embeddings(embeddings_data)
        
        logger.info(f"Recreated {len(point_ids)} embeddings")
        
        return {
            "status": "success",
            "processed": len(point_ids),
            "point_ids": point_ids,
            "message": f"Successfully recreated {len(point_ids)} embeddings"
        }
        
    except Exception as e:
        logger.error(f"Error in recreate all embeddings: {e}")
        return {
            "status": "error",
            "message": f"Failed to recreate embeddings: {e}"
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="health_check_embeddings")
def health_check_embeddings_task(self):
    """
    Kiểm tra health của embedding services
    """
    try:
        # Kiểm tra BGE3 API
        embedding_service = get_embedding_service()
        bge3_health = embedding_service.health_check()
        
        # Kiểm tra Qdrant
        vector_service = get_vector_service()
        qdrant_health = vector_service.health_check()
        
        # Lấy thông tin collection
        collection_info = vector_service.get_collection_info()
        
        return {
            "status": "success",
            "bge3_api": bge3_health,
            "qdrant": qdrant_health,
            "collection_info": collection_info,
            "message": "Health check completed"
        }
        
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        return {
            "status": "error",
            "message": f"Health check failed: {e}"
        }
