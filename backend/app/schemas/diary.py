"""Health diary schemas."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class DiaryCreate(BaseModel):
    record_date: date
    sleep_hours: Optional[float] = None
    exercise_minutes: Optional[int] = None
    exercise_type: str = ""
    meal_count: Optional[int] = None
    water_glasses: Optional[int] = None
    diet_note: str = ""
    mood_score: Optional[int] = None
    note: str = ""


class DiaryUpdate(BaseModel):
    sleep_hours: Optional[float] = None
    exercise_minutes: Optional[int] = None
    exercise_type: Optional[str] = None
    meal_count: Optional[int] = None
    water_glasses: Optional[int] = None
    diet_note: Optional[str] = None
    mood_score: Optional[int] = None
    note: Optional[str] = None


class DiaryResponse(BaseModel):
    id: int
    record_date: date
    sleep_hours: Optional[float] = None
    exercise_minutes: Optional[int] = None
    exercise_type: str
    meal_count: Optional[int] = None
    water_glasses: Optional[int] = None
    diet_note: str
    mood_score: Optional[int] = None
    note: str
    created_at: datetime

    class Config:
        from_attributes = True
