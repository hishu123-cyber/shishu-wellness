"""Health diary routes."""

from datetime import date
from flask import Blueprint, request, jsonify, g

from app.core.database import SessionLocal
from app.models.health_diary import HealthDiary
from app.services.auth_service import login_required

diary_bp = Blueprint("diary", __name__, url_prefix="/api/diary")


@diary_bp.route("/", methods=["GET"])
@login_required
def list_diaries():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    db = SessionLocal()
    try:
        q = db.query(HealthDiary).filter(HealthDiary.user_id == g.current_user.id)
        if start_date:
            q = q.filter(HealthDiary.record_date >= date.fromisoformat(start_date))
        if end_date:
            q = q.filter(HealthDiary.record_date <= date.fromisoformat(end_date))
        q = q.order_by(HealthDiary.record_date.desc())
        return jsonify([_diary_to_dict(r) for r in q.all()])
    finally:
        db.close()


@diary_bp.route("/today", methods=["GET"])
@login_required
def get_today():
    today = date.today()
    db = SessionLocal()
    try:
        record = (
            db.query(HealthDiary)
            .filter(HealthDiary.user_id == g.current_user.id, HealthDiary.record_date == today)
            .first()
        )
        if not record:
            return jsonify(None)
        return jsonify(_diary_to_dict(record))
    finally:
        db.close()


@diary_bp.route("/", methods=["POST"])
@login_required
def create_diary():
    data = request.get_json()
    if not data:
        return jsonify({"detail": "No data"}), 400

    db = SessionLocal()
    try:
        record_date = date.fromisoformat(data["record_date"])
        existing = (
            db.query(HealthDiary)
            .filter(HealthDiary.user_id == g.current_user.id, HealthDiary.record_date == record_date)
            .first()
        )
        if existing:
            return jsonify({"detail": "Diary entry for this date already exists"}), 400

        diary = HealthDiary(user_id=g.current_user.id, record_date=record_date)
        for field in ("sleep_hours", "exercise_minutes", "exercise_type",
                      "meal_count", "water_glasses", "diet_note", "mood_score", "note"):
            if field in data:
                setattr(diary, field, data[field])

        db.add(diary)
        db.commit()
        db.refresh(diary)
        return jsonify(_diary_to_dict(diary)), 201
    finally:
        db.close()


@diary_bp.route("/<int:diary_id>", methods=["PUT"])
@login_required
def update_diary(diary_id):
    data = request.get_json()
    if not data:
        return jsonify({"detail": "No data"}), 400

    db = SessionLocal()
    try:
        diary = (
            db.query(HealthDiary)
            .filter(HealthDiary.id == diary_id, HealthDiary.user_id == g.current_user.id)
            .first()
        )
        if not diary:
            return jsonify({"detail": "Not found"}), 404

        for field in ("sleep_hours", "exercise_minutes", "exercise_type",
                      "meal_count", "water_glasses", "diet_note", "mood_score", "note"):
            if field in data:
                setattr(diary, field, data[field])

        db.commit()
        db.refresh(diary)
        return jsonify(_diary_to_dict(diary))
    finally:
        db.close()


@diary_bp.route("/<int:diary_id>", methods=["DELETE"])
@login_required
def delete_diary(diary_id):
    db = SessionLocal()
    try:
        diary = (
            db.query(HealthDiary)
            .filter(HealthDiary.id == diary_id, HealthDiary.user_id == g.current_user.id)
            .first()
        )
        if not diary:
            return jsonify({"detail": "Not found"}), 404

        db.delete(diary)
        db.commit()
        return jsonify({"message": "Deleted"})
    finally:
        db.close()


def _diary_to_dict(r):
    return {
        "id": r.id,
        "record_date": r.record_date.isoformat(),
        "sleep_hours": r.sleep_hours,
        "exercise_minutes": r.exercise_minutes,
        "exercise_type": r.exercise_type,
        "meal_count": r.meal_count,
        "water_glasses": r.water_glasses,
        "diet_note": r.diet_note,
        "mood_score": r.mood_score,
        "note": r.note,
        "created_at": r.created_at.isoformat(),
    }
