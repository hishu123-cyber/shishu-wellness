"""Flask entrypoint."""

from flask import Flask
from flask_cors import CORS

from app.core.config import settings
from app.core.database import init_db

from app.routers.auth import auth_bp
from app.routers.constitution import constitution_bp
from app.routers.diary import diary_bp
from app.routers.recipes import recipes_bp
from app.routers.solar_terms import solar_terms_bp
from app.routers.articles import articles_bp

app = Flask(__name__)
app.config["SECRET_KEY"] = settings.SECRET_KEY
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(constitution_bp)
app.register_blueprint(diary_bp)
app.register_blueprint(recipes_bp)
app.register_blueprint(solar_terms_bp)
app.register_blueprint(articles_bp)


@app.route("/api/health")
def health():
    return {"status": "ok", "version": settings.VERSION}


# ── Init DB on first import ──
init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
