"""Recipe schemas."""

from typing import Optional
from pydantic import BaseModel


class RecipeResponse(BaseModel):
    id: int
    name: str
    category: str
    suitable_constitution: str
    suitable_season: str
    ingredients: str
    steps: str
    功效: str
    image_url: str

    class Config:
        from_attributes = True
