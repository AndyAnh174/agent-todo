from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging

from ..dependencies import db_session, get_current_user
from ..schemas.analysis import (
    AnalysisRequest, AnalysisResponse, ExportRequest, ExportResponse,
    AnalysisHistoryResponse, TimeRange
)
from ..services.analysis_service import get_analysis_service, GeminiAnalysisService
from ..models.todo import Todo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/analysis", tags=["Analysis"])

@router.post("/generate", response_model=AnalysisResponse)
async def generate_analysis(
    request: AnalysisRequest,
    db: Session = Depends(db_session),
    user=Depends(get_current_user)
):
    """
    Tạo analysis mới cho user
    """
    try:
        logger.info(f"Generating analysis for user {user.id}, time_range: {request.time_range}")
        
        # Get todos data
        todos_data = _get_todos_data_for_analysis(db, user.id, request.time_range, request.custom_start_date, request.custom_end_date)
        
        # Get analysis service
        analysis_service = get_analysis_service()
        
        # Update service with todos data
        analysis_service._get_todos_data = lambda user_id, time_range: todos_data
        
        # Generate analysis
        analysis = analysis_service.analyze_todos(
            str(user.id), 
            request.time_range, 
            request.compare_with_previous
        )
        
        # Cache result
        analysis_service.cache_analysis(str(user.id), request.time_range, analysis)
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error generating analysis: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/latest", response_model=AnalysisResponse)
async def get_latest_analysis(
    time_range: TimeRange = TimeRange.WEEK,
    user=Depends(get_current_user)
):
    """
    Lấy analysis gần nhất từ cache
    """
    try:
        analysis_service = get_analysis_service()
        cached_analysis = analysis_service.get_cached_analysis(str(user.id), time_range)
        
        if not cached_analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No cached analysis found")
        
        return cached_analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting latest analysis: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/export", response_model=ExportResponse)
async def export_analysis_report(
    request: ExportRequest,
    user=Depends(get_current_user)
):
    """
    Export báo cáo analysis
    """
    try:
        logger.info(f"Exporting analysis for user {user.id}, format: {request.format}")
        
        # Get latest analysis
        analysis_service = get_analysis_service()
        analysis = analysis_service.get_cached_analysis(str(user.id), request.time_range)
        
        if not analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No analysis found to export")
        
        if request.format == "json":
            # Return JSON data directly
            return ExportResponse(
                data=analysis.dict(),
                filename=f"analysis_{request.time_range}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                generated_at=datetime.now()
            )
        else:
            # PDF export - would need PDF generator
            # For now, return JSON as fallback
            return ExportResponse(
                data=analysis.dict(),
                filename=f"analysis_{request.time_range}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                generated_at=datetime.now()
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting analysis: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/history", response_model=AnalysisHistoryResponse)
async def get_analysis_history(
    user=Depends(get_current_user)
):
    """
    Lấy lịch sử các lần phân tích
    """
    try:
        # For now, return empty history
        # In real implementation, would query database for analysis history
        return AnalysisHistoryResponse(
            items=[],
            total=0
        )
        
    except Exception as e:
        logger.error(f"Error getting analysis history: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

def _get_todos_data_for_analysis(
    db: Session, 
    user_id: str, 
    time_range: TimeRange, 
    custom_start: datetime = None, 
    custom_end: datetime = None
) -> List[Dict[str, Any]]:
    """
    Lấy dữ liệu todos cho analysis
    """
    try:
        # Calculate date range
        now = datetime.now()
        
        if time_range == TimeRange.WEEK:
            start_date = now - timedelta(days=7)
            end_date = now
        elif time_range == TimeRange.MONTH:
            start_date = now - timedelta(days=30)
            end_date = now
        elif time_range == TimeRange.CUSTOM and custom_start and custom_end:
            start_date = custom_start
            end_date = custom_end
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
                "completed_at": todo.completed_at.isoformat() if hasattr(todo, 'completed_at') and todo.completed_at else None,
                "group_id": str(todo.group_id) if todo.group_id else None,
                "tags": [tag.name for tag in todo.tags] if hasattr(todo, 'tags') else []
            })
        
        return todos_data
        
    except Exception as e:
        logger.error(f"Error getting todos data: {e}")
        return []
