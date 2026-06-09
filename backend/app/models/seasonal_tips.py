"""24 solar terms (节气) wellness tips."""

from sqlalchemy import Column, Integer, String, Text, DateTime

from app.core.database import Base


class SolarTerm(Base):
    """24节气养生知识."""
    __tablename__ = "solar_terms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), nullable=False)         # 立春/雨水/惊蛰/...
    date_mmdd = Column(String(10), nullable=False)    # "02-04" 表示每年2月4日左右
    description = Column(Text, default="")
    wellness_tips = Column(Text, default="")           # 养生建议
    food_recommendations = Column(Text, default="")    # 推荐食材
    exercise_advice = Column(Text, default="")          # 运动建议
    image_url = Column(String(255), default="")
