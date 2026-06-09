"""Wellness articles routes."""

from flask import Blueprint, request, jsonify

from app.core.database import SessionLocal
from app.models.article import Article

articles_bp = Blueprint("articles", __name__, url_prefix="/api/articles")


@articles_bp.route("/", methods=["GET"])
def list_articles():
    category = request.args.get("category")
    page = int(request.args.get("page", 1))
    size = int(request.args.get("size", 10))

    db = SessionLocal()
    try:
        q = db.query(Article).filter(Article.is_published == True)
        if category:
            q = q.filter(Article.category == category)

        total = q.count()
        articles = q.order_by(Article.created_at.desc()).offset((page - 1) * size).limit(size).all()

        return jsonify({
            "total": total,
            "page": page,
            "size": size,
            "items": [
                {
                    "id": a.id,
                    "title": a.title,
                    "summary": a.summary,
                    "category": a.category,
                    "tags": a.tags,
                    "author": a.author,
                    "cover_image": a.cover_image,
                    "view_count": a.view_count,
                    "created_at": a.created_at.isoformat(),
                }
                for a in articles
            ],
        })
    finally:
        db.close()


@articles_bp.route("/<int:article_id>", methods=["GET"])
def get_article(article_id):
    db = SessionLocal()
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            return jsonify({"detail": "Not found"}), 404

        article.view_count += 1
        db.commit()

        return jsonify({
            "id": article.id,
            "title": article.title,
            "summary": article.summary,
            "content": article.content,
            "category": article.category,
            "tags": article.tags,
            "author": article.author,
            "cover_image": article.cover_image,
            "view_count": article.view_count,
            "created_at": article.created_at.isoformat(),
            "updated_at": article.updated_at.isoformat(),
        })
    finally:
        db.close()
