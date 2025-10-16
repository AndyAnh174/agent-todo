from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import db_session, get_current_user
from ..models.tag import Tag
from ..schemas.tags import TagCreate, TagOut, TagUpdate


router = APIRouter(prefix="/api/v1/tags", tags=["tags"])


@router.get("/", response_model=List[TagOut])
def list_tags(db: Session = Depends(db_session), user=Depends(get_current_user)):
    return db.query(Tag).order_by(Tag.created_at.desc()).all()


@router.post("/", response_model=TagOut, status_code=201)
def create_tag(payload: TagCreate, db: Session = Depends(db_session), user=Depends(get_current_user)):
    tag = Tag(name=payload.name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=TagOut)
def update_tag(tag_id: str, payload: TagUpdate, db: Session = Depends(db_session), user=Depends(get_current_user)):
    tag = db.query(Tag).get(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    tag.name = payload.name
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: str, db: Session = Depends(db_session), user=Depends(get_current_user)):
    tag = db.query(Tag).get(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
    return None


