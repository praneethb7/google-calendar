from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey,
    Integer, String, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    timezone = Column(String(100), default="UTC")
    created_at = Column(DateTime, default=datetime.utcnow)

    calendars = relationship("Calendar", back_populates="owner", cascade="all, delete")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete")


class Calendar(Base):
    __tablename__ = "calendars"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    color = Column(String(7), default="#1a73e8")
    is_primary = Column(Boolean, default=False)
    timezone = Column(String(100), default="UTC")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="calendars")
    events = relationship("Event", back_populates="calendar", cascade="all, delete")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    calendar_id = Column(Integer, ForeignKey("calendars.id", ondelete="CASCADE"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    title = Column(String(500), nullable=False)
    description = Column(Text)
    location = Column(String(500))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_all_day = Column(Boolean, default=False)
    timezone = Column(String(100), default="UTC")

    # Recurrence
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(Text)
    recurrence_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"))
    original_start_time = Column(DateTime)
    is_exception = Column(Boolean, default=False)
    series_id = Column(String(100), index=True)
    exception_dates = Column(Text)  # comma-separated ISO dates

    # Appearance
    status = Column(String(50), default="confirmed")
    color = Column(String(7))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    calendar = relationship("Calendar", back_populates="events")
    reminders = relationship("Reminder", back_populates="event", cascade="all, delete")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    minutes_before = Column(Integer, nullable=False)
    method = Column(String(50), default="popup")
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="reminders")


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    default_event_duration = Column(Integer, default=60)
    show_declined_events = Column(Boolean, default=False)
    week_start_day = Column(Integer, default=0)
    time_format = Column(String(10), default="12h")
    date_format = Column(String(50), default="MM/DD/YYYY")
    show_week_numbers = Column(Boolean, default=False)
    default_reminder_minutes = Column(Integer, default=30)
    working_hours_start = Column(String(8), default="09:00:00")
    working_hours_end = Column(String(8), default="17:00:00")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="preferences")
