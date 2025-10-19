from typing import List, Optional
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..dependencies import db_session, get_current_user
from ..models.todo import Todo
from ..models.tag import Tag
from ..models.todo_tag import TodoTag
from ..schemas.todos import TodoCompletePatch, TodoCreate, TodoOut, TodoUpdate, TodoOrderUpdate
from ..services.automation_engine import AutomationEngine
from ..services.smart_logic_engine import get_smart_logic_engine
from ..tasks.embedding_tasks import create_todo_embedding_task, update_todo_embedding_task, delete_todo_embedding_task


router = APIRouter(prefix="/api/v1", tags=["todos"])

logger = logging.getLogger(__name__)


@router.get("/todos/smart/insights")
def get_smart_insights(db: Session = Depends(db_session), user=Depends(get_current_user)):
    """Lấy insights thông minh về productivity của user"""
    smart_engine = get_smart_logic_engine(db)
    insights = smart_engine.get_smart_insights(user.id)
    return insights


@router.post("/todos/smart/analyze")
def analyze_todo_content(
    title: str,
    description: str = "",
    db: Session = Depends(db_session),
    user=Depends(get_current_user)
):
    """Phân tích nội dung todo và đưa ra gợi ý thông minh"""
    smart_engine = get_smart_logic_engine(db)
    analysis = smart_engine.analyze_todo_content(title, description)
    return analysis


@router.get("/todos", response_model=List[TodoOut])
def list_todos(
    db: Session = Depends(db_session),
    user=Depends(get_current_user),
    is_completed: Optional[bool] = None,
    is_important: Optional[bool] = None,
    q: Optional[str] = None,
    group_id: Optional[str] = None,
    tag_id: Optional[str] = None,  # placeholder for future join filter
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    # Load todos with tags using joinedload
    query = db.query(Todo).options(joinedload(Todo.tags)).filter(Todo.user_id == user.id)
    if is_completed is not None:
        query = query.filter(Todo.is_completed == is_completed)
    if is_important is not None:
        query = query.filter(Todo.is_important == is_important)
    if q:
        like = f"%{q}%"
        query = query.filter(Todo.title.ilike(like))
    if group_id:
        query = query.filter(Todo.group_id == group_id)
    # tag_id filter would require join with todo_tag; implement later
    try:
        # Try to order by order_index first
        items = query.order_by(Todo.order_index.asc(), Todo.created_at.desc()).limit(limit).offset(offset).all()
    except Exception:
        # Fallback to created_at only if order_index column doesn't exist
        items = query.order_by(Todo.created_at.desc()).limit(limit).offset(offset).all()
    return items


@router.post("/todos", response_model=TodoOut, status_code=201)
def create_todo(payload: TodoCreate, db: Session = Depends(db_session), user=Depends(get_current_user)):
    # Áp dụng Smart Logic Engine để tự động phân tích và gợi ý TRƯỚC khi tạo todo
    smart_engine = get_smart_logic_engine(db)
    analysis = smart_engine.analyze_todo_content(payload.title, payload.description or "")
    
    # Tạo todo với smart suggestions
    todo = Todo(
        title=payload.title,
        description=payload.description,
        due_time=payload.due_time or analysis["suggested_deadline"],
        group_id=payload.group_id or analysis["suggested_group"],
        is_important=(analysis["suggested_priority"] == "high"),  # Chỉ dùng smart analysis
        user_id=user.id,
    )
    
    db.add(todo)
    db.commit()
    db.refresh(todo)
    
    # Xử lý tags
    tags_to_link = []
    
    # 1. Tags từ payload (user input)
    if payload.tag_ids:
        existing_tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all()
        tags_to_link.extend(existing_tags)
    
    # 2. Tags thông minh từ Smart Logic Engine
    if analysis["suggested_tags"]:
        smart_tag_ids = smart_engine.create_smart_tags(analysis["suggested_tags"], user.id)
        smart_tags = db.query(Tag).filter(Tag.id.in_(smart_tag_ids)).all()
        tags_to_link.extend(smart_tags)
    
    # Link tags to todo
    if tags_to_link:
        todo.tags = tags_to_link
        db.commit()
        db.refresh(todo)
    
    # Trigger automation for todo creation
    automation_engine = AutomationEngine(db)
    context = {
        "todo_id": todo.id,
        "todo_title": todo.title,
        "todo_description": todo.description or "",
        "due_time": todo.due_time,
        "is_important": todo.is_important,
        "todo_tags": [tag.name for tag in tags_to_link],  # Sử dụng actual tags
        "smart_analysis": analysis  # Thêm analysis vào context
    }
    automation_engine.trigger_automation("on_todo_created", context)
    
    # Trigger embedding generation
    create_todo_embedding_task.delay(str(todo.id))
    
    return todo


@router.get("/todos/{todo_id}", response_model=TodoOut)
def get_todo(todo_id: str, db: Session = Depends(db_session), user=Depends(get_current_user)):
    todo = db.query(Todo).options(joinedload(Todo.tags)).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.put("/todos/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: str, payload: TodoUpdate, db: Session = Depends(db_session), user=Depends(get_current_user)):
    todo = db.query(Todo).options(joinedload(Todo.tags)).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    allowed_fields = {
        "title",
        "description",
        "due_time",
        "group_id",
        "is_important",
        "is_completed",
    }
    updates = payload.model_dump(exclude_unset=True)
    
    # Xử lý tags riêng biệt
    tag_ids = updates.pop("tag_ids", None)
    
    for field, value in updates.items():
        if field in allowed_fields:
            setattr(todo, field, value)
    
    # Cập nhật tags nếu có
    if tag_ids is not None:
        existing_tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
        todo.tags = existing_tags
    
    db.add(todo)
    db.commit()
    db.refresh(todo)
    
    # Trigger embedding update
    update_todo_embedding_task.delay(str(todo.id))
    
    return todo


@router.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: str, db: Session = Depends(db_session), user=Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Trigger embedding deletion
    delete_todo_embedding_task.delay(str(todo.id))
    
    db.delete(todo)
    db.commit()
    return None


@router.patch("/todos/{todo_id}/complete", response_model=TodoOut)
def complete_todo(todo_id: str, payload: TodoCompletePatch, db: Session = Depends(db_session), user=Depends(get_current_user)):
    todo = db.query(Todo).options(joinedload(Todo.tags)).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.is_completed = payload.is_completed
    db.add(todo)
    db.commit()
    db.refresh(todo)
    
    # Trigger embedding update for completion status change
    update_todo_embedding_task.delay(str(todo.id))
    
    return todo


# Tag management endpoints for todos
@router.post("/todos/{todo_id}/tags")
def add_tag_to_todo(todo_id: str, tag_id: str = Query(...), db: Session = Depends(db_session), user=Depends(get_current_user)):
    """Add a tag to a todo"""
    # Check if todo exists and belongs to user
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Check if tag exists
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if relationship already exists
    existing_relation = db.query(TodoTag).filter(
        TodoTag.todo_id == todo_id, 
        TodoTag.tag_id == tag_id
    ).first()
    
    if existing_relation:
        return {"message": "Tag already assigned to todo"}
    
    # Create new relationship
    todo_tag = TodoTag(todo_id=todo_id, tag_id=tag_id)
    db.add(todo_tag)
    db.commit()
    
    # Refresh todo with tags
    db.refresh(todo)
    todo = db.query(Todo).options(joinedload(Todo.tags)).filter(Todo.id == todo_id).first()
    
    return {"message": "Tag added successfully", "todo": todo}


@router.delete("/todos/{todo_id}/tags/{tag_id}")
def remove_tag_from_todo(todo_id: str, tag_id: str, db: Session = Depends(db_session), user=Depends(get_current_user)):
    """Remove a tag from a todo"""
    # Check if todo exists and belongs to user
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Find and delete the relationship
    todo_tag = db.query(TodoTag).filter(
        TodoTag.todo_id == todo_id, 
        TodoTag.tag_id == tag_id
    ).first()
    
    if not todo_tag:
        raise HTTPException(status_code=404, detail="Tag not found on this todo")
    
    db.delete(todo_tag)
    db.commit()
    
    return {"message": "Tag removed successfully"}


@router.get("/todos/{todo_id}/tags")
def get_todo_tags(todo_id: str, db: Session = Depends(db_session), user=Depends(get_current_user)):
    """Get all tags for a todo"""
    # Check if todo exists and belongs to user
    todo = db.query(Todo).options(joinedload(Todo.tags)).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    return todo.tags


@router.put("/todos/order")
def update_todos_order(
    order_data: TodoOrderUpdate,
    db: Session = Depends(db_session),
    user=Depends(get_current_user)
):
    """Update the order of todos"""
    try:
        todo_ids = order_data.todo_ids
        
        # Verify all todos belong to the user
        todos = db.query(Todo).filter(
            Todo.id.in_(todo_ids),
            Todo.user_id == user.id
        ).all()
        
        if len(todos) != len(todo_ids):
            raise HTTPException(status_code=400, detail="Some todos not found or don't belong to user")
        
        # Update order_index for each todo (with fallback if column doesn't exist)
        for index, todo_id in enumerate(todo_ids):
            todo = db.query(Todo).filter(Todo.id == todo_id).first()
            if todo:
                try:
                    # Try to update order_index
                    todo.order_index = index
                except AttributeError:
                    # Column doesn't exist yet, skip silently
                    logger.warning(f"order_index column not found, skipping order update for todo {todo_id}")
                    continue
                todo.updated_at = datetime.now()
        
        db.commit()
        
        return {"message": "Todo order updated successfully", "updated_count": len(todo_ids)}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating todo order: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update todo order: {e}")


