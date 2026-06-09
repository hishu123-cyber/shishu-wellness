"""Body constitution schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class QuestionResponse(BaseModel):
    id: int
    question_text: str
    category: str

    class Config:
        from_attributes = True


class ConstitutionSubmit(BaseModel):
    answers: dict  # {question_id: score}


class ConstitutionResult(BaseModel):
    id: int
    scores: dict
    result_type: str
    created_at: datetime

    class Config:
        from_attributes = True
