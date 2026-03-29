from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ── Calendar ──────────────────────────────────────────────────────────────────

class CalendarBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#1a73e8"
    timezone: str = "UTC"


class CalendarCreate(CalendarBase):
    pass


class CalendarUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    timezone: Optional[str] = None


class CalendarOut(CalendarBase):
    id: int
    owner_id: int
    is_primary: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Reminder ──────────────────────────────────────────────────────────────────

class ReminderIn(BaseModel):
    minutes_before: int
    method: str = "popup"


class ReminderOut(ReminderIn):
    id: int

    model_config = {"from_attributes": True}


# ── Event ─────────────────────────────────────────────────────────────────────

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False
    timezone: str = "UTC"
    calendar_id: int
    color: Optional[str] = None
    status: str = "confirmed"
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    series_id: Optional[str] = None


class EventCreate(EventBase):
    reminders: Optional[List[ReminderIn]] = []


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    timezone: Optional[str] = None
    calendar_id: Optional[int] = None
    color: Optional[str] = None
    status: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None
    reminders: Optional[List[ReminderIn]] = None


class EventOut(EventBase):
    id: int
    creator_id: Optional[int]
    recurrence_id: Optional[int]
    original_start_time: Optional[datetime]
    is_exception: bool
    exception_dates: Optional[str]
    created_at: datetime
    updated_at: datetime
    reminders: List[ReminderOut] = []

    model_config = {"from_attributes": True}


# ── User / Profile ────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    timezone: str

    model_config = {"from_attributes": True}


class UserPreferencesOut(BaseModel):
    default_event_duration: int
    show_declined_events: bool
    week_start_day: int
    time_format: str
    date_format: str
    show_week_numbers: bool
    default_reminder_minutes: int
    working_hours_start: str
    working_hours_end: str

    model_config = {"from_attributes": True}


class UserPreferencesUpdate(BaseModel):
    default_event_duration: Optional[int] = None
    show_declined_events: Optional[bool] = None
    week_start_day: Optional[int] = None
    time_format: Optional[str] = None
    date_format: Optional[str] = None
    show_week_numbers: Optional[bool] = None
    default_reminder_minutes: Optional[int] = None
    working_hours_start: Optional[str] = None
    working_hours_end: Optional[str] = None


# ── RL Environment ────────────────────────────────────────────────────────────

class EnvState(BaseModel):
    events: List[EventOut]
    calendars: List[CalendarOut]
    user: UserOut
    timestamp: datetime


class EnvResetRequest(BaseModel):
    seed_events: Optional[List[EventCreate]] = None


class EnvStepRequest(BaseModel):
    action: str  # create_event | update_event | delete_event | move_event
    payload: dict


class EnvStepResponse(BaseModel):
    success: bool
    action_taken: str
    message: str
    state: EnvState
