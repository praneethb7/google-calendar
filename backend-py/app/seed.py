"""
Seeds the database with a single default user and primary calendar on startup.
No authentication — every request operates as this user.
"""

DEFAULT_USER_ID = 1
DEFAULT_USER_EMAIL = "agent@gcal-rl.local"
DEFAULT_USER_NAME = "RL Agent"
DEFAULT_CALENDAR_NAME = "My Calendar"
DEFAULT_CALENDAR_COLOR = "#1a73e8"


def seed_default_user(db):
    from app import models

    user = db.query(models.User).filter(models.User.id == DEFAULT_USER_ID).first()
    if not user:
        user = models.User(
            id=DEFAULT_USER_ID,
            email=DEFAULT_USER_EMAIL,
            name=DEFAULT_USER_NAME,
            timezone="UTC",
        )
        db.add(user)
        db.flush()

    cal = db.query(models.Calendar).filter(
        models.Calendar.owner_id == DEFAULT_USER_ID,
        models.Calendar.is_primary == True,
    ).first()
    if not cal:
        cal = models.Calendar(
            owner_id=DEFAULT_USER_ID,
            name=DEFAULT_CALENDAR_NAME,
            color=DEFAULT_CALENDAR_COLOR,
            is_primary=True,
            timezone="UTC",
        )
        db.add(cal)

    prefs = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == DEFAULT_USER_ID
    ).first()
    if not prefs:
        prefs = models.UserPreferences(user_id=DEFAULT_USER_ID)
        db.add(prefs)

    db.commit()
