"""
RL Environment endpoints.

GET  /env/state          → current observation (all events + calendars)
POST /env/reset          → wipe events, optionally seed new ones
POST /env/step           → execute one action, return new state

Actions for /env/step:
  create_event  – payload: EventCreate fields
  update_event  – payload: { id, ...EventUpdate fields }
  delete_event  – payload: { id }
  move_event    – payload: { id, start_time, end_time }
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.seed import DEFAULT_USER_ID

router = APIRouter(prefix="/env", tags=["rl-environment"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _current_state(db: Session) -> schemas.EnvState:
    user = db.query(models.User).filter(models.User.id == DEFAULT_USER_ID).first()
    calendars = db.query(models.Calendar).filter(models.Calendar.owner_id == DEFAULT_USER_ID).all()
    events = (
        db.query(models.Event)
        .join(models.Calendar)
        .filter(models.Calendar.owner_id == DEFAULT_USER_ID)
        .order_by(models.Event.start_time)
        .all()
    )
    return schemas.EnvState(
        user=schemas.UserOut.model_validate(user),
        calendars=[schemas.CalendarOut.model_validate(c) for c in calendars],
        events=[schemas.EventOut.model_validate(e) for e in events],
        timestamp=datetime.utcnow(),
    )


def _default_calendar_id(db: Session) -> int:
    cal = db.query(models.Calendar).filter(
        models.Calendar.owner_id == DEFAULT_USER_ID,
        models.Calendar.is_primary == True,
    ).first()
    if not cal:
        cal = db.query(models.Calendar).filter(
            models.Calendar.owner_id == DEFAULT_USER_ID
        ).first()
    if not cal:
        raise HTTPException(status_code=500, detail="No calendar found for default user")
    return cal.id


# ── routes ────────────────────────────────────────────────────────────────────

@router.get("/state", response_model=schemas.EnvState)
def get_state(db: Session = Depends(get_db)):
    return _current_state(db)


@router.post("/reset", response_model=schemas.EnvState)
def reset_env(body: schemas.EnvResetRequest, db: Session = Depends(get_db)):
    """Delete all events for the default user, then optionally seed new ones."""
    db.query(models.Event).filter(
        models.Event.calendar_id.in_(
            db.query(models.Calendar.id).filter(models.Calendar.owner_id == DEFAULT_USER_ID)
        )
    ).delete(synchronize_session=False)
    db.commit()

    if body.seed_events:
        default_cal_id = _default_calendar_id(db)
        for seed in body.seed_events:
            if not seed.calendar_id:
                seed = seed.model_copy(update={"calendar_id": default_cal_id})
            reminders_data = seed.reminders or []
            event_data = seed.model_dump(exclude={"reminders"})
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

    return _current_state(db)


@router.post("/step", response_model=schemas.EnvStepResponse)
def step_env(body: schemas.EnvStepRequest, db: Session = Depends(get_db)):
    action = body.action
    payload = body.payload
    message = ""

    try:
        if action == "create_event":
            if "calendar_id" not in payload:
                payload["calendar_id"] = _default_calendar_id(db)
            event_in = schemas.EventCreate(**payload)
            event = models.Event(
                **event_in.model_dump(exclude={"reminders"}),
                creator_id=DEFAULT_USER_ID,
            )
            db.add(event)
            db.flush()
            for r in (event_in.reminders or []):
                db.add(models.Reminder(
                    event_id=event.id,
                    user_id=DEFAULT_USER_ID,
                    minutes_before=r.minutes_before,
                    method=r.method,
                ))
            db.commit()
            message = f"Created event '{event.title}' (id={event.id})"

        elif action == "update_event":
            event_id = int(payload.pop("id"))
            event = db.query(models.Event).filter(models.Event.id == event_id).first()
            if not event:
                raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
            event_in = schemas.EventUpdate(**payload)
            for field, value in event_in.model_dump(exclude_unset=True, exclude={"reminders"}).items():
                setattr(event, field, value)
            if event_in.reminders is not None:
                db.query(models.Reminder).filter(models.Reminder.event_id == event_id).delete()
                for r in event_in.reminders:
                    db.add(models.Reminder(
                        event_id=event_id,
                        user_id=DEFAULT_USER_ID,
                        minutes_before=r.minutes_before,
                        method=r.method,
                    ))
            db.commit()
            message = f"Updated event id={event_id}"

        elif action == "delete_event":
            event_id = int(payload["id"])
            event = db.query(models.Event).filter(models.Event.id == event_id).first()
            if not event:
                raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
            db.delete(event)
            db.commit()
            message = f"Deleted event id={event_id}"

        elif action == "move_event":
            event_id = int(payload["id"])
            event = db.query(models.Event).filter(models.Event.id == event_id).first()
            if not event:
                raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
            event.start_time = datetime.fromisoformat(payload["start_time"])
            event.end_time = datetime.fromisoformat(payload["end_time"])
            db.commit()
            message = f"Moved event id={event_id} to {payload['start_time']}"

        else:
            return schemas.EnvStepResponse(
                success=False,
                action_taken=action,
                message=f"Unknown action: {action}",
                state=_current_state(db),
            )

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        return schemas.EnvStepResponse(
            success=False,
            action_taken=action,
            message=str(exc),
            state=_current_state(db),
        )

    return schemas.EnvStepResponse(
        success=True,
        action_taken=action,
        message=message,
        state=_current_state(db),
    )
