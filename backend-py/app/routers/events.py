from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.seed import DEFAULT_USER_ID

router = APIRouter(prefix="/api/events", tags=["events"])


def _get_event_or_404(event_id: int, db: Session) -> models.Event:
    event = db.query(models.Event).join(models.Calendar).filter(
        models.Event.id == event_id,
        models.Calendar.owner_id == DEFAULT_USER_ID,
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def _build_event_out(event: models.Event) -> schemas.EventOut:
    return schemas.EventOut.model_validate(event)


@router.get("", response_model=List[schemas.EventOut])
def get_events(
    calendar_ids: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Event).join(models.Calendar).filter(
        models.Calendar.owner_id == DEFAULT_USER_ID
    )
    if calendar_ids:
        ids = [int(i) for i in calendar_ids.split(",") if i.strip()]
        q = q.filter(models.Event.calendar_id.in_(ids))
    if start_date:
        q = q.filter(models.Event.end_time >= start_date)
    if end_date:
        q = q.filter(models.Event.start_time <= end_date)
    return q.order_by(models.Event.start_time).all()


@router.get("/search", response_model=List[schemas.EventOut])
def search_events(q: str = Query(...), db: Session = Depends(get_db)):
    term = f"%{q}%"
    return (
        db.query(models.Event)
        .join(models.Calendar)
        .filter(
            models.Calendar.owner_id == DEFAULT_USER_ID,
            or_(
                models.Event.title.ilike(term),
                models.Event.description.ilike(term),
                models.Event.location.ilike(term),
            ),
        )
        .order_by(models.Event.start_time)
        .all()
    )


@router.get("/{event_id}", response_model=schemas.EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    return _get_event_or_404(event_id, db)


@router.post("", response_model=schemas.EventOut, status_code=201)
def create_event(body: schemas.EventCreate, db: Session = Depends(get_db)):
    # Verify calendar belongs to default user
    cal = db.query(models.Calendar).filter(
        models.Calendar.id == body.calendar_id,
        models.Calendar.owner_id == DEFAULT_USER_ID,
    ).first()
    if not cal:
        raise HTTPException(status_code=404, detail="Calendar not found")

    reminders_data = body.reminders or []
    event_data = body.model_dump(exclude={"reminders"})
    event = models.Event(**event_data, creator_id=DEFAULT_USER_ID)
    db.add(event)
    db.flush()

    for r in reminders_data:
        db.add(models.Reminder(
            event_id=event.id,
            user_id=DEFAULT_USER_ID,
            minutes_before=r.minutes_before,
            method=r.method,
        ))

    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_id}", response_model=schemas.EventOut)
def update_event(event_id: int, body: schemas.EventUpdate, db: Session = Depends(get_db)):
    event = _get_event_or_404(event_id, db)

    reminders_data = body.reminders
    update_fields = body.model_dump(exclude_unset=True, exclude={"reminders"})
    for field, value in update_fields.items():
        setattr(event, field, value)

    if reminders_data is not None:
        db.query(models.Reminder).filter(models.Reminder.event_id == event_id).delete()
        for r in reminders_data:
            db.add(models.Reminder(
                event_id=event.id,
                user_id=DEFAULT_USER_ID,
                minutes_before=r.minutes_before,
                method=r.method,
            ))

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    delete_all: bool = Query(False),
    db: Session = Depends(get_db),
):
    event = _get_event_or_404(event_id, db)

    if delete_all and event.series_id:
        db.query(models.Event).filter(
            models.Event.series_id == event.series_id
        ).delete()
    else:
        db.delete(event)

    db.commit()
