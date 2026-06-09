"""User & profile models."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, Text

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    nickname = Column(String(50), default="")
    avatar = Column(String(255), default="")

    # Profile
    gender = Column(String(10), default="")          # male / female
    birth_year = Column(Integer, nullable=True)
    height_cm = Column(Integer, nullable=True)
    weight_kg = Column(Integer, nullable=True)

    # TCM constitution (中医体质)
    constitution_type = Column(String(50), default="")  # 平和质/气虚质/阳虚质/...

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
