"""Auth helpers for Flask."""

from functools import wraps
from flask import request, g
from jose import jwt, JWTError

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User


def get_token_user():
    """Extract user from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user
    finally:
        db.close()


def login_required(f):
    """Decorator: requires valid JWT."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_token_user()
        if not user:
            return {"detail": "Unauthorized"}, 401
        g.current_user = user
        return f(*args, **kwargs)
    return decorated
