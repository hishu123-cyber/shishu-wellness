"""24 Solar Terms wellness tips."""

from datetime import date
from flask import Blueprint, jsonify

from app.core.database import SessionLocal
from app.models.seasonal_tips import SolarTerm

solar_terms_bp = Blueprint("solar_terms", __name__, url_prefix="/api/solar-terms")


@solar_terms_bp.route("/", methods=["GET"])
def list_terms():
    db = SessionLocal()
    try:
        terms = db.query(SolarTerm).all()
        return jsonify([
            {
                "id": t.id,
                "name": t.name,
                "date_mmdd": t.date_mmdd,
                "description": t.description,
                "wellness_tips": t.wellness_tips,
                "food_recommendations": t.food_recommendations,
                "exercise_advice": t.exercise_advice,
            }
            for t in terms
        ])
    finally:
        db.close()


@solar_terms_bp.route("/current", methods=["GET"])
def get_current_term():
    today = date.today()
    mmdd = today.strftime("%m-%d")

    db = SessionLocal()
    try:
        terms = db.query(SolarTerm).order_by(SolarTerm.date_mmdd).all()
        for t in terms:
            if t.date_mmdd >= mmdd:
                return jsonify({
                    "id": t.id,
                    "name": t.name,
                    "date_mmdd": t.date_mmdd,
                    "description": t.description,
                    "wellness_tips": t.wellness_tips,
                    "food_recommendations": t.food_recommendations,
                    "exercise_advice": t.exercise_advice,
                })
        if terms:
            t = terms[0]
            return jsonify({
                "id": t.id,
                "name": t.name,
                "date_mmdd": t.date_mmdd,
                "description": t.description,
                "wellness_tips": t.wellness_tips,
                "food_recommendations": t.food_recommendations,
                "exercise_advice": t.exercise_advice,
            })
        return jsonify(None)
    finally:
        db.close()
