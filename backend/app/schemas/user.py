"""User schemas for request/response."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserRegister(BaseModel):
    username: str
    password: str
    nickname: str = ""


class UserLogin(BaseModel):
    username: str
    password: str


class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    gender: Optional[str] = None
    birth_year: Optional[int] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    username: str
    nickname: str
    avatar: str
    gender: str
    birth_year: Optional[int] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    constitution_type: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
