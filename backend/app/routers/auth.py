"""Auth routes: register, login, profile."""

from flask import Blueprint, request, jsonify, g
from app.core.database import SessionLocal
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.services.auth_service import login_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"detail": "No data"}), 400

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == data["username"]).first()
        if existing:
            return jsonify({"detail": "Username already exists"}), 400

        user = User(
            username=data["username"],
            hashed_password=hash_password(data["password"]),
            nickname=data.get("nickname", data["username"]),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token({"sub": str(user.id)})
        return jsonify({
            "access_token": token,
            "token_type": "bearer",
            "user": _user_to_dict(user),
        })
    finally:
        db.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"detail": "No data"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == data["username"]).first()
        if not user or not verify_password(data["password"], user.hashed_password):
            return jsonify({"detail": "Invalid credentials"}), 401

        token = create_access_token({"sub": str(user.id)})
        return jsonify({
            "access_token": token,
            "token_type": "bearer",
            "user": _user_to_dict(user),
        })
    finally:
        db.close()


@auth_bp.route("/me", methods=["GET"])
@login_required
def get_profile():
    return jsonify(_user_to_dict(g.current_user))


@auth_bp.route("/me", methods=["PUT"])
@login_required
def update_profile():
    data = request.get_json()
    if not data:
        return jsonify({"detail": "No data"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == g.current_user.id).first()
        for field in ("nickname", "gender", "birth_year", "height_cm", "weight_kg"):
            if field in data:
                setattr(user, field, data[field])
        db.commit()
        db.refresh(user)
        return jsonify(_user_to_dict(user))
    finally:
        db.close()


def _user_to_dict(user):
    return {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "gender": user.gender,
        "birth_year": user.birth_year,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "constitution_type": user.constitution_type,
    }
