from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..dependencies import get_current_user
from ..models.automation_rule import AutomationRule
from ..models.user import User
from ..schemas.automation_rules import (
    AutomationRuleCreate,
    AutomationRuleOut,
    AutomationRuleUpdate
)

router = APIRouter(prefix="/api/v1", tags=["automation-rules"])


@router.get("/automation-rules", response_model=List[AutomationRuleOut])
def list_automation_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List user automation rules"""
    rules = db.query(AutomationRule).filter(
        AutomationRule.user_id == current_user.id
    ).order_by(AutomationRule.priority.desc(), AutomationRule.created_at.desc()).all()
    
    return rules


@router.post("/automation-rules", response_model=AutomationRuleOut)
def create_automation_rule(
    rule: AutomationRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new automation rule"""
    db_rule = AutomationRule(
        user_id=current_user.id,
        name=rule.name,
        trigger=rule.trigger,
        conditions=rule.conditions,
        action=rule.action,
        is_active=rule.is_active,
        priority=rule.priority
    )
    
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    
    return db_rule


@router.get("/automation-rules/{rule_id}", response_model=AutomationRuleOut)
def get_automation_rule(
    rule_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get automation rule by ID"""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    return rule


@router.put("/automation-rules/{rule_id}", response_model=AutomationRuleOut)
def update_automation_rule(
    rule_id: UUID,
    rule_update: AutomationRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update automation rule"""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    # Update fields
    for field, value in rule_update.dict(exclude_unset=True).items():
        setattr(rule, field, value)
    
    db.commit()
    db.refresh(rule)
    
    return rule


@router.delete("/automation-rules/{rule_id}")
def delete_automation_rule(
    rule_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete automation rule"""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Automation rule deleted successfully"}


@router.patch("/automation-rules/{rule_id}/toggle")
def toggle_automation_rule(
    rule_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle automation rule active status"""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    rule.is_active = not rule.is_active
    db.commit()
    db.refresh(rule)
    
    return {
        "message": f"Automation rule {'activated' if rule.is_active else 'deactivated'}",
        "is_active": rule.is_active
    }
