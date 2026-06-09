"""Body constitution assessment routes."""

import json
from flask import Blueprint, request, jsonify, g

from app.core.database import SessionLocal
from app.models.body_constitution import ConstitutionQuestion, ConstitutionRecord
from app.services.auth_service import login_required

constitution_bp = Blueprint("constitution", __name__, url_prefix="/api/constitution")


@constitution_bp.route("/questions", methods=["GET"])
def get_questions():
    db = SessionLocal()
    try:
        questions = db.query(ConstitutionQuestion).all()
        return jsonify([
            {"id": q.id, "question_text": q.question_text, "category": q.category}
            for q in questions
        ])
    finally:
        db.close()


@constitution_bp.route("/assess", methods=["POST"])
@login_required
def assess():
    data = request.get_json()
    if not data or "answers" not in data:
        return jsonify({"detail": "answers required"}), 400

    db = SessionLocal()
    try:
        questions = db.query(ConstitutionQuestion).all()
        questions_map = {q.id: q for q in questions}

        category_scores = {}
        for qid_str, score in data["answers"].items():
            qid = int(qid_str)
            q = questions_map.get(qid)
            if q:
                category_scores.setdefault(q.category, 0)
                category_scores[q.category] += score * q.weight

        sorted_scores = sorted(category_scores.items(), key=lambda x: -x[1])
        result_type = sorted_scores[0][0] if sorted_scores else "平和质"

        record = ConstitutionRecord(
            user_id=g.current_user.id,
            scores=json.dumps(category_scores, ensure_ascii=False),
            result_type=result_type,
        )
        db.add(record)

        user = db.query(type(g.current_user)).filter(
            type(g.current_user).id == g.current_user.id
        ).first()
        if hasattr(user, "constitution_type"):
            user.constitution_type = result_type
        db.commit()
        db.refresh(record)

        return jsonify({
            "id": record.id,
            "scores": category_scores,
            "result_type": result_type,
            "created_at": record.created_at.isoformat(),
        })
    finally:
        db.close()


@constitution_bp.route("/records", methods=["GET"])
@login_required
def get_records():
    db = SessionLocal()
    try:
        records = (
            db.query(ConstitutionRecord)
            .filter(ConstitutionRecord.user_id == g.current_user.id)
            .order_by(ConstitutionRecord.created_at.desc())
            .all()
        )
        return jsonify([
            {
                "id": r.id,
                "scores": json.loads(r.scores),
                "result_type": r.result_type,
                "created_at": r.created_at.isoformat(),
            }
            for r in records
        ])
    finally:
        db.close()
