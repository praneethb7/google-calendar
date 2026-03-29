from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.seed import DEFAULT_USER_ID

router = APIRouter(prefix="/api/calendars", tags=["calendars"])


@router.get("", response_model=List[schemas.CalendarOut])
def get_calendars(db: Session = Depends(get_db)):
    return db.query(models.Calendar).filter(models.Calendar.owner_id == DEFAULT_USER_ID).all()


@router.post("", response_model=schemas.CalendarOut, status_code=201)
def create_calendar(body: schemas.CalendarCreate, db: Session = Depends(get_db)):
    cal = models.Calendar(**body.model_dump(), owner_id=DEFAULT_USER_ID)
    db.add(cal)
    db.commit()
    db.refresh(cal)
    return cal


@router.get("/{calendar_id}", response_model=schemas.CalendarOut)
def get_calendar(calendar_id: int, db: Session = Depends(get_db)):
    cal = db.query(models.Calendar).filter(
        models.Calendar.id == calendar_id,
        models.Calendar.owner_id == DEFAULT_USER_ID,
    ).first()
    if not cal:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return cal


@router.put("/{calendar_id}", response_model=schemas.CalendarOut)
def update_calendar(calendar_id: int, body: schemas.CalendarUpdate, db: Session = Depends(get_db)):
    cal = db.query(models.Calendar).filter(
        models.Calendar.id == calendar_id,
        models.Calendar.owner_id == DEFAULT_USER_ID,
    ).first()
    if not cal:
        raise HTTPException(status_code=404, detail="Calendar not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cal, field, value)
    db.commit()
    db.refresh(cal)
    return cal


@router.delete("/{calendar_id}", status_code=204)
def delete_calendar(calendar_id: int, db: Session = Depends(get_db)):
    cal = db.query(models.Calendar).filter(
        models.Calendar.id == calendar_id,
        models.Calendar.owner_id == DEFAULT_USER_ID,
        models.Calendar.is_primary == False,
    ).first()
    if not cal:
        raise HTTPException(status_code=404, detail="Calendar not found or is primary")
    db.delete(cal)
    db.commit()
