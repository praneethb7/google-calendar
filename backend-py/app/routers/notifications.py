"""
Notification endpoints — pending event reminders for the default user.

A reminder is "pending" when its event starts within the look-ahead window
(default 7 days) from now. One entry is returned per reminder on an event.
"""

from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.seed import DEFAULT_USER_ID

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/pending", response_model=List[schemas.NotificationOut])
def pending_reminders(
    within_days: int = Query(7, ge=0, le=365),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    horizon = now + timedelta(days=within_days)

    events = (
        db.query(models.Event)
        .join(models.Calendar)
        .filter(
            models.Calendar.owner_id == DEFAULT_USER_ID,
            models.Event.start_time >= now,
            models.Event.start_time <= horizon,
        )
        .order_by(models.Event.start_time)
        .all()
    )

    out: List[schemas.NotificationOut] = []
    for event in events:
        for reminder in event.reminders:
            out.append(
                schemas.NotificationOut(
                    id=f"{event.id}-{reminder.id}",
                    event_id=event.id,
                    title=event.title,
                    description=event.description,
                    location=event.location,
                    start_time=event.start_time,
                    calendar_name=event.calendar.name,
                    calendar_color=event.color or event.calendar.color,
                    minutes_before=reminder.minutes_before,
                )
            )
    return out
