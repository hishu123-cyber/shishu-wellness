"""TCM body constitution (中医九种体质) models."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, Float, Text

from app.core.database import Base


class ConstitutionQuestion(Base):
    """题库 — 体质辨识量表题目."""
    __tablename__ = "constitution_questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    category = Column(String(20), nullable=False)  # 平和质/气虚质/阳虚质/...
    weight = Column(Integer, default=1)


class ConstitutionRecord(Base):
    """用户每次测评的记录."""
    __tablename__ = "constitution_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    scores = Column(Text, default="{}")        # JSON: {"平和质": 85, "气虚质": 30, ...}
    result_type = Column(String(50), default="")  # 最终判定体质
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
