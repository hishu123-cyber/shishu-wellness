# -*- coding: utf-8 -*-
"""Recipe routes."""

from flask import Blueprint, request, jsonify
from app.core.database import SessionLocal
from app.models.recipe import Recipe

recipes_bp = Blueprint("recipes", __name__, url_prefix="/api/recipes")


@recipes_bp.route("", methods=["GET"])
def list_recipes():
    constitution = request.args.get("constitution")
    season = request.args.get("season")
    category = request.args.get("category")

    db = SessionLocal()
    try:
        q = db.query(Recipe)
        if constitution:
            q = q.filter(Recipe.suitable_constitution.contains(constitution))
        if season:
            q = q.filter(Recipe.suitable_season.contains(season))
        if category:
            q = q.filter(Recipe.category == category)
        return jsonify([_recipe_to_dict(r) for r in q.all()])
    finally:
        db.close()


@recipes_bp.route("/<int:recipe_id>", methods=["GET"])
def get_recipe(recipe_id):
    db = SessionLocal()
    try:
        recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
        if not recipe:
            return jsonify({"detail": "Not found"}), 404
        return jsonify(_recipe_to_dict(recipe))
    finally:
        db.close()


def _recipe_to_dict(r):
    return {
        "id": r.id,
        "name": r.name,
        "category": r.category,
        "suitable_constitution": r.suitable_constitution,
        "suitable_season": r.suitable_season,
        "ingredients": r.ingredients,
        "steps": r.steps,
        "benefits": r.benefits,
        "image_url": r.image_url,
    }
