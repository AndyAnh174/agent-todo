from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import db_session, get_current_user
from ..models.group import Group
from ..schemas.groups import GroupCreate, GroupOut, GroupUpdate


router = APIRouter(prefix="/api/v1/groups", tags=["groups"])


@router.get("/", response_model=List[GroupOut])
def list_groups(db: Session = Depends(db_session), user=Depends(get_current_user)):
    return db.query(Group).order_by(Group.created_at.desc()).all()


@router.post("/", response_model=GroupOut, status_code=201)
def create_group(payload: GroupCreate, db: Session = Depends(db_session), user=Depends(get_current_user)):
    group = Group(name=payload.name)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.put("/{group_id}", response_model=GroupOut)
def update_group(group_id: str, payload: GroupUpdate, db: Session = Depends(db_session), user=Depends(get_current_user)):
    group = db.query(Group).get(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.name = payload.name
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=204)
def delete_group(group_id: str, db: Session = Depends(db_session), user=Depends(get_current_user)):
    group = db.query(Group).get(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()
    return None


