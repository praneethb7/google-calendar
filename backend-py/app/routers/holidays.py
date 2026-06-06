"""
Holiday endpoints — supported countries, per-user holiday-calendar preferences,
and computed holiday occurrences. Data is generated locally (see holidays_data).
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.holidays_data import COUNTRIES, SUPPORTED_CODES, holidays_for
from app.seed import DEFAULT_USER_ID

router = APIRouter(prefix="/api/holidays", tags=["holidays"])


@router.get("/countries", response_model=List[schemas.Country])
def list_countries():
    return COUNTRIES


@router.get("/preferences", response_model=List[schemas.HolidayPreferenceOut])
def get_preferences(db: Session = Depends(get_db)):
    return (
        db.query(models.HolidayPreference)
        .filter(models.HolidayPreference.user_id == DEFAULT_USER_ID)
        .order_by(models.HolidayPreference.country_code)
        .all()
    )


@router.post("/preferences", response_model=schemas.HolidayPreferenceOut)
def upsert_preference(body: schemas.HolidayPreferenceIn, db: Session = Depends(get_db)):
    code = body.country_code.upper()
    if code not in SUPPORTED_CODES:
        raise HTTPException(status_code=400, detail=f"Unsupported country: {code}")

    pref = (
        db.query(models.HolidayPreference)
        .filter(
            models.HolidayPreference.user_id == DEFAULT_USER_ID,
            models.HolidayPreference.country_code == code,
        )
        .first()
    )
    if pref:
        pref.is_enabled = body.is_enabled
        pref.region = body.region
    else:
        pref = models.HolidayPreference(
            user_id=DEFAULT_USER_ID,
            country_code=code,
            region=body.region,
            is_enabled=body.is_enabled,
        )
        db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref


@router.delete("/preferences/{pref_id}", status_code=204)
def delete_preference(pref_id: int, db: Session = Depends(get_db)):
    pref = (
        db.query(models.HolidayPreference)
        .filter(
            models.HolidayPreference.id == pref_id,
            models.HolidayPreference.user_id == DEFAULT_USER_ID,
        )
        .first()
    )
    if not pref:
        raise HTTPException(status_code=404, detail="Preference not found")
    db.delete(pref)
    db.commit()


@router.get("/occurrences", response_model=List[schemas.HolidayOut])
def get_occurrences(
    year: Optional[int] = Query(None),
    country: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Holidays for a given year. Defaults to the current year and the user's
    enabled holiday calendars; pass ?country=US to query a single country."""
    year = year or datetime.utcnow().year

    if country:
        codes = [country.upper()]
    else:
        codes = [
            p.country_code
            for p in db.query(models.HolidayPreference)
            .filter(
                models.HolidayPreference.user_id == DEFAULT_USER_ID,
                models.HolidayPreference.is_enabled == True,
            )
            .all()
        ]

    out = []
    for code in codes:
        out.extend(holidays_for(code, year))
    out.sort(key=lambda h: h["date"])
    return out
