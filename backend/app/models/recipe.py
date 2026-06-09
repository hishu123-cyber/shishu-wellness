# -*- coding: utf-8 -*-
"""Dietary recipe / medicinal food models."""

from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base


class Recipe(Base):
    """Medicinal food recipe."""
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), default="")
    suitable_constitution = Column(String(100), default="")
    suitable_season = Column(String(50), default="")
    ingredients = Column(Text, default="")
    steps = Column(Text, default="")
    benefits = Column(Text, default="")
    image_url = Column(String(255), default="")
