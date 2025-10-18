from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..dependencies import get_current_user
from ..models.user_preference import UserPreference
from ..models.user import User
from ..schemas.user_preferences import (
    UserPreferenceCreate,
    UserPreferenceOut,
    UserPreferenceUpdate
)

router = APIRouter(prefix="/api/v1", tags=["preferences"])


@router.get("/preferences", response_model=UserPreferenceOut)
def get_user_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user preferences"""
    preferences = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreference(
            user_id=current_user.id,
            work_hours={"start": "08:00", "end": "17:00"},
            notification_preferences={"email_enabled": True, "push_enabled": True},
            language="vi",
            timezone="Asia/Ho_Chi_Minh"
        )
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    
    return preferences


@router.put("/preferences", response_model=UserPreferenceOut)
def update_user_preferences(
    preferences_update: UserPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user preferences"""
    preferences = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        # Create new preferences
        preferences = UserPreference(user_id=current_user.id)
        db.add(preferences)
    
    # Update fields
    for field, value in preferences_update.dict(exclude_unset=True).items():
        setattr(preferences, field, value)
    
    db.commit()
    db.refresh(preferences)
    
    return preferences


@router.post("/preferences", response_model=UserPreferenceOut)
def create_user_preferences(
    preferences: UserPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create user preferences"""
    # Check if preferences already exist
    existing = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User preferences already exist. Use PUT to update."
        )
    
    db_preferences = UserPreference(
        user_id=current_user.id,
        default_group_id=preferences.default_group_id,
        work_hours=preferences.work_hours,
        notification_preferences=preferences.notification_preferences,
        language=preferences.language,
        timezone=preferences.timezone
    )
    
    db.add(db_preferences)
    db.commit()
    db.refresh(db_preferences)
    
    return db_preferences
