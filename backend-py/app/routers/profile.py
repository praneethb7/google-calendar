from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.seed import DEFAULT_USER_ID

router = APIRouter(prefix="/api", tags=["profile"])


@router.get("/profile", response_model=schemas.UserOut)
def get_profile(db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == DEFAULT_USER_ID).first()
    return user


@router.get("/preferences", response_model=schemas.UserPreferencesOut)
def get_preferences(db: Session = Depends(get_db)):
    prefs = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == DEFAULT_USER_ID
    ).first()
    if not prefs:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return prefs


@router.put("/preferences", response_model=schemas.UserPreferencesOut)
def update_preferences(body: schemas.UserPreferencesUpdate, db: Session = Depends(get_db)):
    prefs = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == DEFAULT_USER_ID
    ).first()
    if not prefs:
        raise HTTPException(status_code=404, detail="Preferences not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    db.commit()
    db.refresh(prefs)
    return prefs
