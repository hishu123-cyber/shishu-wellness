"""Wellness articles & knowledge posts."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean

from app.core.database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    summary = Column(String(500), default="")
    content = Column(Text, default="")
    category = Column(String(50), default="")       # 食疗/运动/睡眠/情志/...
    tags = Column(String(200), default="")           # 逗号分隔
    author = Column(String(50), default="")
    cover_image = Column(String(255), default="")
    is_published = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
