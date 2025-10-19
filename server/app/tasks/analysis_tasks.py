from celery import Celery
from celery.schedules import crontab
from sqlalchemy.orm import Session
from typing import List
import logging
from datetime import datetime, timedelta

from ..config import settings
from ..db import get_db
from ..models.user import User
from ..services.analysis_service import get_analysis_service
from ..schemas.analysis import TimeRange

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    "analysis_tasks",
    broker=settings.celery_broker_url,
    backend=settings.redis_url
)

@celery_app.task
def daily_analysis_task():
    """
    Celery periodic task chạy mỗi ngày 00:00 để phân tích todos của tất cả users
    """
    try:
        logger.info("Starting daily analysis task")
        
        # Get all users
        db = next(get_db())
        users = db.query(User).all()
        
        analysis_service = get_analysis_service()
        
        for user in users:
            try:
                logger.info(f"Running analysis for user {user.id}")
                
                # Generate analysis for both week and month
                for time_range in [TimeRange.WEEK, TimeRange.MONTH]:
                    try:
                        # Get todos data for this user and time range
                        todos_data = _get_todos_data_for_user(db, user.id, time_range)
                        
                        if not todos_data:
                            logger.info(f"No todos found for user {user.id} in {time_range}")
                            continue
                        
                        # Update service with todos data
                        analysis_service._get_todos_data = lambda user_id, tr: todos_data
                        
                        # Generate analysis
                        analysis = analysis_service.analyze_todos(
                            str(user.id), 
                            time_range, 
                            compare_with_previous=True
                        )
                        
                        # Cache result
                        analysis_service.cache_analysis(str(user.id), time_range, analysis)
                        
                        logger.info(f"Analysis completed for user {user.id}, time_range: {time_range}")
                        
                    except Exception as e:
                        logger.error(f"Error analyzing user {user.id} for {time_range}: {e}")
                        continue
                        
            except Exception as e:
                logger.error(f"Error processing user {user.id}: {e}")
                continue
        
        logger.info("Daily analysis task completed")
        
    except Exception as e:
        logger.error(f"Error in daily analysis task: {e}")
    finally:
        db.close()

@celery_app.task
def generate_analysis_task(user_id: str, time_range: str, compare_with_previous: bool = True):
    """
    Background task để generate analysis cho một user cụ thể
    """
    try:
        logger.info(f"Generating analysis for user {user_id}, time_range: {time_range}")
        
        db = next(get_db())
        analysis_service = get_analysis_service()
        
        # Get todos data
        todos_data = _get_todos_data_for_user(db, user_id, TimeRange(time_range))
        
        if not todos_data:
            logger.warning(f"No todos found for user {user_id}")
            return {"status": "no_data", "message": "No todos found"}
        
        # Update service with todos data
        analysis_service._get_todos_data = lambda uid, tr: todos_data
        
        # Generate analysis
        analysis = analysis_service.analyze_todos(
            user_id, 
            TimeRange(time_range), 
            compare_with_previous
        )
        
        # Cache result
        analysis_service.cache_analysis(user_id, TimeRange(time_range), analysis)
        
        logger.info(f"Analysis generated successfully for user {user_id}")
        return {"status": "success", "analysis_id": f"{user_id}_{time_range}"}
        
    except Exception as e:
        logger.error(f"Error generating analysis for user {user_id}: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@celery_app.task
def export_report_task(user_id: str, time_range: str, format: str, include_charts: bool = True):
    """
    Background task để export báo cáo analysis
    """
    try:
        logger.info(f"Exporting report for user {user_id}, format: {format}")
        
        analysis_service = get_analysis_service()
        
        # Get cached analysis
        analysis = analysis_service.get_cached_analysis(user_id, TimeRange(time_range))
        
        if not analysis:
            logger.warning(f"No cached analysis found for user {user_id}")
            return {"status": "no_data", "message": "No analysis found"}
        
        # For now, just return the analysis data
        # In the future, this would generate PDF/other formats
        if format == "json":
            return {
                "status": "success",
                "data": analysis.dict(),
                "filename": f"analysis_{time_range}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            }
        else:
            # PDF generation would go here
            return {
                "status": "success",
                "message": "PDF export not yet implemented",
                "filename": f"analysis_{time_range}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            }
        
    except Exception as e:
        logger.error(f"Error exporting report for user {user_id}: {e}")
        return {"status": "error", "message": str(e)}

def _get_todos_data_for_user(db: Session, user_id: str, time_range: TimeRange) -> List[dict]:
    """
    Lấy dữ liệu todos cho một user cụ thể
    """
    try:
        from ..models.todo import Todo
        
        # Calculate date range
        now = datetime.now()
        
        if time_range == TimeRange.WEEK:
            start_date = now - timedelta(days=7)
            end_date = now
        elif time_range == TimeRange.MONTH:
            start_date = now - timedelta(days=30)
            end_date = now
        else:
            start_date = now - timedelta(days=7)
            end_date = now
        
        # Query todos
        todos = db.query(Todo).filter(
            Todo.user_id == user_id,
            Todo.created_at >= start_date,
            Todo.created_at <= end_date
        ).all()
        
        # Convert to dict format
        todos_data = []
        for todo in todos:
            todos_data.append({
                "id": str(todo.id),
                "title": todo.title,
                "description": todo.description or "",
                "due_time": todo.due_time.isoformat() if todo.due_time else None,
                "is_completed": todo.is_completed,
                "is_important": todo.is_important,
                "created_at": todo.created_at.isoformat(),
                "completed_at": getattr(todo, 'completed_at', None).isoformat() if hasattr(todo, 'completed_at') and getattr(todo, 'completed_at') else None,
                "group_id": str(todo.group_id) if todo.group_id else None,
                "tags": [tag.name for tag in todo.tags] if hasattr(todo, 'tags') else []
            })
        
        return todos_data
        
    except Exception as e:
        logger.error(f"Error getting todos data for user {user_id}: {e}")
        return []

# Configure periodic tasks
celery_app.conf.beat_schedule = {
    'daily-analysis': {
        'task': 'server.app.tasks.analysis_tasks.daily_analysis_task',
        'schedule': crontab(hour=0, minute=0),  # Run daily at midnight
    },
}

celery_app.conf.timezone = 'Asia/Ho_Chi_Minh'
