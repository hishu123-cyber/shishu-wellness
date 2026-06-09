"""Health diary — daily sleep, diet, exercise, mood, notes."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Date

from app.core.database import Base


class HealthDiary(Base):
    __tablename__ = "health_diaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    record_date = Column(Date, nullable=False)

    # Sleep (hours)
    sleep_hours = Column(Float, nullable=True)

    # Exercise (minutes)
    exercise_minutes = Column(Integer, nullable=True)
    exercise_type = Column(String(50), default="")

    # Diet
    meal_count = Column(Integer, nullable=True)  # 几餐
    water_glasses = Column(Integer, nullable=True)  # 几杯水
    diet_note = Column(Text, default="")

    # Mood (1-10)
    mood_score = Column(Integer, nullable=True)

    # Note
    note = Column(Text, default="")

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
