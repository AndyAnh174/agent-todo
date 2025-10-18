from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..dependencies import get_current_user
from ..models.notification import Notification, NotificationStatus
from ..models.user import User
from ..schemas.notifications import (
    NotificationCreate,
    NotificationOut,
    NotificationUpdate,
    NotificationView
)

router = APIRouter(prefix="/api/v1", tags=["notifications"])


@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List user notifications"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()
    
    return notifications


@router.post("/notifications", response_model=NotificationOut)
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new notification"""
    db_notification = Notification(
        todo_id=notification.todo_id,
        user_id=current_user.id,
        notify_at=notification.notify_at,
        notification_type=notification.notification_type,
        subject=notification.subject,
        content=notification.content
    )
    
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    return db_notification


@router.patch("/notifications/{notification_id}/view", response_model=NotificationOut)
def mark_notification_viewed(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark notification as viewed"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.status = NotificationStatus.VIEWED
    notification.viewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(notification)
    
    return notification


@router.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted successfully"}


@router.put("/notifications/{notification_id}", response_model=NotificationOut)
def update_notification(
    notification_id: UUID,
    notification_update: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Update fields
    for field, value in notification_update.dict(exclude_unset=True).items():
        setattr(notification, field, value)
    
    db.commit()
    db.refresh(notification)
    
    return notification
