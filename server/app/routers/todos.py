from typing import List, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..dependencies import db_session, get_current_user
from ..models.todo import Todo
from ..schemas.todos import TodoCompletePatch, TodoCreate, TodoOut, TodoUpdate
from ..services.automation_engine import AutomationEngine
from ..services.smart_logic_engine import get_smart_logic_engine


router = APIRouter(prefix="/api/v1", tags=["todos"])


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
    query = db.query(Todo).filter(Todo.user_id == user.id)
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
    
    # Tạo tags thông minh nếu có
    if analysis["suggested_tags"]:
        tag_ids = smart_engine.create_smart_tags(analysis["suggested_tags"], user.id)
        # TODO: Link tags to todo (cần implement todo_tag relationship)
    
    db.add(todo)
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
        "todo_tags": analysis["suggested_tags"],  # Sử dụng suggested tags
        "smart_analysis": analysis  # Thêm analysis vào context
    }
    automation_engine.trigger_automation("on_todo_created", context)
    
    return todo


@router.get("/todos/{todo_id}", response_model=TodoOut)
def get_todo(todo_id: str, db: Session = Depends(db_session), user=Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.put("/todos/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: str, payload: TodoUpdate, db: Session = Depends(db_session), user=Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
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
    for field, value in updates.items():
        if field in allowed_fields:
            setattr(todo, field, value)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: str, db: Session = Depends(db_session), user=Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
    return None


@router.patch("/todos/{todo_id}/complete", response_model=TodoOut)
def complete_todo(todo_id: str, payload: TodoCompletePatch, db: Session = Depends(db_session), user=Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.is_completed = payload.is_completed
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


