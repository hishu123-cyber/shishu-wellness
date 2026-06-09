# -*- coding: utf-8 -*-
"""Simple HTTP API server using only stdlib + sqlite3."""

import json
import sqlite3
import hashlib
import secrets
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import date, datetime

DB = "D:/deepclaw/projects/wellness_app/backend/data/wellness.db"
SECRET_KEY = "wellness-secret-key-change-me"


def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def json_response(data, status=200):
    body = json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")
    return f"HTTP/1.1 {status} {'OK' if status==200 else 'Error'}\r\nContent-Type: application/json; charset=utf-8\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: {len(body)}\r\n\r\n".encode("utf-8") + body


def error_response(msg, status=400):
    return json_response({"detail": msg}, status)


def read_body(handler):
    length = int(handler.headers.get("Content-Length", 0))
    if length > 0:
        return json.loads(handler.rfile.read(length).decode("utf-8"))
    return {}


def parse_path(path):
    parsed = urlparse(path)
    parts = [p for p in parsed.path.split("/") if p]
    qs = parse_qs(parsed.query, keep_blank_values=True)
    return parts, {k: v[0] for k, v in qs.items()}


def make_token(user_id):
    payload = json.dumps({"sub": user_id, "exp": datetime.now().timestamp() + 86400 * 7})
    sig = hashlib.sha256((payload + SECRET_KEY).encode()).hexdigest()[:16]
    return f"{payload}.{sig}"


def verify_token(token):
    try:
        payload_b64, sig = token.split(".", 1)
        expected_sig = hashlib.sha256((payload_b64 + SECRET_KEY).encode()).hexdigest()[:16]
        if sig != expected_sig:
            return None
        payload = json.loads(payload_b64)
        if payload.get("exp", 0) < datetime.now().timestamp():
            return None
        return payload.get("sub")
    except Exception:
        return None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # quiet

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        self._handle("GET")

    def do_POST(self):
        self._handle("POST")

    def do_PUT(self):
        self._handle("PUT")

    def do_DELETE(self):
        self._handle("DELETE")

    def _handle(self, method):
        parts, qs = parse_path(self.path)
        try:
            result = self.route(parts, qs, method)
            if result is None:
                self._write(error_response("Not found", 404))
            elif isinstance(result, tuple):
                self._write(json_response(result[0], result[1]) if len(result) == 2 else json_response(result[0]))
            elif isinstance(result, dict):
                self._write(json_response(result))
            elif isinstance(result, list):
                self._write(json_response(result))
            else:
                self._write(result)
        except Exception as e:
            import traceback
            traceback.print_exc()
            self._write(error_response(str(e), 500))

    def _write(self, resp):
        if isinstance(resp, bytes):
            self.wfile.write(resp)
        else:
            self.wfile.write(resp)

    def get_user_id(self):
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        return verify_token(auth[7:])

    def route(self, parts, qs, method):
        # Health
        if parts == ["api", "health"]:
            return {"status": "ok", "version": "0.1.0"}

        # Auth
        if parts == ["api", "auth", "register"] and method == "POST":
            return self._register()
        if parts == ["api", "auth", "login"] and method == "POST":
            return self._login()
        if parts == ["api", "auth", "me"] and method == "GET":
            return self._get_profile()
        if parts == ["api", "auth", "me"] and method == "PUT":
            return self._update_profile()

        # Constitution
        if parts == ["api", "constitution", "questions"] and method == "GET":
            return self._get_questions()
        if parts == ["api", "constitution", "assess"] and method == "POST":
            return self._assess_constitution()
        if parts == ["api", "constitution", "records"] and method == "GET":
            return self._get_constitution_records()

        # Diary
        if parts == ["api", "diary"] and method == "GET":
            return self._list_diaries(qs)
        if parts == ["api", "diary", "today"] and method == "GET":
            return self._get_today_diary()
        if parts == ["api", "diary"] and method == "POST":
            return self._create_diary()
        if len(parts) == 3 and parts[:2] == ["api", "diary"] and method == "PUT":
            return self._update_diary(int(parts[2]))
        if len(parts) == 3 and parts[:2] == ["api", "diary"] and method == "DELETE":
            return self._delete_diary(int(parts[2]))

        # Recipes
        if parts == ["api", "recipes"] and method == "GET":
            return self._list_recipes(qs)
        if len(parts) == 3 and parts[:2] == ["api", "recipes"] and method == "GET":
            return self._get_recipe(int(parts[2]))

        # Solar terms
        if parts == ["api", "solar-terms"] and method == "GET":
            return self._list_solar_terms()
        if parts == ["api", "solar-terms", "current"] and method == "GET":
            return self._get_current_term()

        # Articles
        if parts == ["api", "articles"] and method == "GET":
            return self._list_articles(qs)
        if len(parts) == 3 and parts[:2] == ["api", "articles"] and method == "GET":
            return self._get_article(int(parts[2]))

        return None

    # ── Auth handlers ──
    def _register(self):
        data = read_body(self)
        if not data.get("username") or not data.get("password"):
            return error_response("username and password required"), 400
        db = get_db()
        try:
            existing = db.execute("SELECT id FROM users WHERE username=?", (data["username"],)).fetchone()
            if existing:
                return error_response("Username already exists"), 400
            pw_hash = hashlib.sha256((data["password"] + SECRET_KEY).encode()).hexdigest()
            cur = db.execute(
                "INSERT INTO users (username, hashed_password, nickname) VALUES (?,?,?)",
                (data["username"], pw_hash, data.get("nickname", data["username"]))
            )
            db.commit()
            user_id = cur.lastrowid
            token = make_token(user_id)
            return {"access_token": token, "token_type": "bearer", "user": self._user_dict(user_id, db)}
        finally:
            db.close()

    def _login(self):
        data = read_body(self)
        db = get_db()
        try:
            user = db.execute("SELECT * FROM users WHERE username=?", (data.get("username"),)).fetchone()
            if not user:
                return error_response("Invalid credentials"), 401
            pw_hash = hashlib.sha256((data["password"] + SECRET_KEY).encode()).hexdigest()
            if user["hashed_password"] != pw_hash:
                return error_response("Invalid credentials"), 401
            token = make_token(user["id"])
            return {"access_token": token, "token_type": "bearer", "user": self._user_dict(user["id"], db)}
        finally:
            db.close()

    def _get_profile(self):
        uid = self.get_user_id()
        if not uid:
            return error_response("Unauthorized", 401)
        db = get_db()
        try:
            return self._user_dict(uid, db)
        finally:
            db.close()

    def _update_profile(self):
        uid = self.get_user_id()
        if not uid:
            return error_response("Unauthorized", 401)
        data = read_body(self)
        db = get_db()
        try:
            fields = []
            vals = []
            for f in ("nickname", "gender", "birth_year", "height_cm", "weight_kg"):
                if f in data:
                    fields.append(f"{f}=?")
                    vals.append(data[f])
            if fields:
                vals.append(uid)
                db.execute(f"UPDATE users SET {', '.join(fields)} WHERE id=?", vals)
                db.commit()
            return self._user_dict(uid, db)
        finally:
            db.close()

    def _user_dict(self, uid, db):
        u = db.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
        if not u:
            return None
        return {
            "id": u["id"],
            "username": u["username"],
            "nickname": u["nickname"] or "",
            "avatar": u["avatar"] or "",
            "gender": u["gender"] or "",
            "birth_year": u["birth_year"],
            "height_cm": u["height_cm"],
            "weight_kg": u["weight_kg"],
            "constitution_type": u["constitution_type"] or "",
        }

    # ── Constitution handlers ──
    def _get_questions(self):
        db = get_db()
        try:
            rows = db.execute("SELECT id, question_text, category FROM constitution_questions").fetchall()
            return [{"id": r["id"], "question_text": r["question_text"], "category": r["category"]} for r in rows]
        finally:
            db.close()

    def _assess_constitution(self):
        uid = self.get_user_id()
        if not uid:
            return error_response("Unauthorized", 401)
        data = read_body(self)
        answers = data.get("answers", {})
        db = get_db()
        try:
            rows = db.execute("SELECT id, category, weight FROM constitution_questions").fetchall()
            qmap = {r["id"]: r for r in rows}
            scores = {}
            for qid_str, score in answers.items():
                q = qmap.get(int(qid_str))
                if q:
                    scores.setdefault(q["category"], 0)
                    scores[q["category"]] += score * q["weight"]
            sorted_scores = sorted(scores.items(), key=lambda x: -x[1])
            result_type = sorted_scores[0][0] if sorted_scores else "平和质"
            db.execute(
                "INSERT INTO constitution_records (user_id, scores, result_type) VALUES (?,?,?)",
                (uid, json.dumps(scores, ensure_ascii=False), result_type)
            )
            db.execute("UPDATE users SET constitution_type=? WHERE id=?", (result_type, uid))
            db.commit()
            return {"scores": scores, "result_type": result_type}
        finally:
            db.close()

    def _get_constitution_records(self):
        uid = self.get_user_id()
        if not uid:
            return error_response("Unauthorized", 401)
        db = get_db()
        try:
            rows = db.execute(
                "SELECT id, scores, result_type, created_at FROM constitution_records WHERE user_id=? ORDER BY created_at DESC",
                (uid,)
            ).fetchall()
            return [{"id": r["id"], "scores": json.loads(r["scores"]), "result_type": r["result_type"],
                     "created_at": r["created_at"]} for r in rows]
        finally:
            db.close()

    # ── Diary handlers ──
    def _list_diaries(self, qs):
        uid = self.get_user_id()
        if not uid:
            return error_response("Unauthorized", 401)
        db = get_db()
        try:
            sql = "SELECT * FROM health_diaries WHERE user_id=?"
            params = [uid]
            if qs.get("start_date"):
                sql += " AND record_date>=?"
                params.append(qs["start_date"])
            if qs.get("end_date"):
                sql += " AND record_date<=?"
                params.append(qs["end_date"])
            sql += " ORDER BY record_date DESC"
            rows = db.execute(sql, params).fetchall()
            return [self._diary_dict(r) for r in rows]
        finally:
            db.close()

    def _get_today_diary(self):
        uid = self.get_user_id()
        if not uid:
            return error_response("Unauthorized", 401)
        db = get_db()
        try:
            r = db.execute(
                "SELECT * FROM health_diaries WHERE user_id=? AND record_date=?",
                (uid, str(date.today()))
            ).fetchone()
            if not r:
                return None
            return self._diary_dict(r)
        finally:
            db.close()

    def _create_diary(self):
        uid = self.get_user_id()
        if not uid:
            return error_response("Unauthorized", 401)
        data = read_body(self)
        db = get_db()
        try:
            record_date = data.get("record_date", str(date.today()))
            exist = db.execute(
                "SELECT id FROM health_diaries WHERE user_id=? AND record_date=?", (uid, record_date)
            ).fetchone()
            if exist:
                return error_response("Entry exists for this date"), 400
            fields = ["user_id", "record_date"]
            vals = [uid, record_date]
            for f in ("sleep_hours", "exercise_minutes", "exercise_type",
                      "meal_count", "water_glasses", "diet_note", "mood_score", "note"):
                if f in data:
                    fields.append(f)
                    vals.append(data[f])
            placeholders = ",".join("?" for _ in fields)
            cur = db.execute(
                f"INSERT INTO health_diaries ({','.join(fields)}) VALUES ({placeholders})", vals
            )
            db.commit()
            r = db.execute("SELECT * FROM health_diaries WHERE id=?", (cur.lastrowid,)).fetchone()
            return self._diary_dict(r), 201
        finally:
            db.close()

    def _update_diary(self, diary_id):
        uid = self.get_user_id()
        if not uid:
            return error_response("Unauthorized", 401)
        data = read_body(self)
        db = get_db()
        try:
            exist = db.execute(
                "SELECT id FROM health_diaries WHERE id=? AND user_id=?", (diary_id, uid)
            ).fetchone()
            if not exist:
                return error_response("Not found", 404)
            fields, vals = [], []
            for f in ("sleep_hours", "exercise_minutes", "exercise_type",
                      "meal_count", "water_glasses", "diet_note", "mood_score", "note"):
                if f in data:
                    fields.append(f"{f}=?")
                    vals.append(data[f])
            if fields:
                vals.append(diary_id)
                db.execute(f"UPDATE health_diaries SET {','.join(fields)} WHERE id=?", vals)
                db.commit()
            r = db.execute("SELECT * FROM health_diaries WHERE id=?", (diary_id,)).fetchone()
            return self._diary_dict(r)
        finally:
            db.close()

    def _delete_diary(self, diary_id):
        uid = self.get_user_id()
        if not uid:
            return error_response("Unauthorized", 401)
        db = get_db()
        try:
            exist = db.execute(
                "SELECT id FROM health_diaries WHERE id=? AND user_id=?", (diary_id, uid)
            ).fetchone()
            if not exist:
                return error_response("Not found", 404)
            db.execute("DELETE FROM health_diaries WHERE id=?", (diary_id,))
            db.commit()
            return {"message": "Deleted"}
        finally:
            db.close()

    def _diary_dict(self, r):
        return {
            "id": r["id"],
            "record_date": r["record_date"],
            "sleep_hours": r["sleep_hours"],
            "exercise_minutes": r["exercise_minutes"],
            "exercise_type": r["exercise_type"] or "",
            "meal_count": r["meal_count"],
            "water_glasses": r["water_glasses"],
            "diet_note": r["diet_note"] or "",
            "mood_score": r["mood_score"],
            "note": r["note"] or "",
            "created_at": r["created_at"],
        }

    # ── Recipe handlers ──
    def _list_recipes(self, qs):
        db = get_db()
        try:
            sql = "SELECT * FROM recipes WHERE 1=1"
            params = []
            if qs.get("constitution"):
                sql += " AND suitable_constitution LIKE ?"
                params.append(f"%{qs['constitution']}%")
            if qs.get("season"):
                sql += " AND suitable_season LIKE ?"
                params.append(f"%{qs['season']}%")
            if qs.get("category"):
                sql += " AND category=?"
                params.append(qs["category"])
            rows = db.execute(sql, params).fetchall()
            return [self._recipe_dict(r) for r in rows]
        finally:
            db.close()

    def _get_recipe(self, rid):
        db = get_db()
        try:
            r = db.execute("SELECT * FROM recipes WHERE id=?", (rid,)).fetchone()
            if not r:
                return error_response("Not found", 404)
            return self._recipe_dict(r)
        finally:
            db.close()

    def _recipe_dict(self, r):
        return {
            "id": r["id"],
            "name": r["name"],
            "category": r["category"] or "",
            "suitable_constitution": r["suitable_constitution"] or "",
            "suitable_season": r["suitable_season"] or "",
            "ingredients": r["ingredients"] or "",
            "steps": r["steps"] or "",
            "benefits": r["benefits"] or "",
            "image_url": r["image_url"] or "",
        }

    # ── Solar term handlers ──
    def _list_solar_terms(self):
        db = get_db()
        try:
            rows = db.execute("SELECT * FROM solar_terms ORDER BY date_mmdd").fetchall()
            return [self._term_dict(r) for r in rows]
        finally:
            db.close()

    def _get_current_term(self):
        db = get_db()
        try:
            today = str(date.today())[5:]
            rows = db.execute("SELECT * FROM solar_terms ORDER BY date_mmdd").fetchall()
            for r in rows:
                if r["date_mmdd"] >= today:
                    return self._term_dict(r)
            if rows:
                return self._term_dict(rows[0])
            return None
        finally:
            db.close()

    def _term_dict(self, r):
        return {
            "id": r["id"],
            "name": r["name"],
            "date_mmdd": r["date_mmdd"],
            "description": r["description"] or "",
            "wellness_tips": r["wellness_tips"] or "",
            "food_recommendations": r["food_recommendations"] or "",
            "exercise_advice": r["exercise_advice"] or "",
        }

    # ── Article handlers ──
    def _list_articles(self, qs):
        db = get_db()
        try:
            sql = "SELECT * FROM articles WHERE is_published=1"
            params = []
            if qs.get("category"):
                sql += " AND category=?"
                params.append(qs["category"])
            total = db.execute(sql.replace("SELECT *", "SELECT count(*) as c"), params).fetchone()["c"]
            page = int(qs.get("page", 1))
            size = int(qs.get("size", 10))
            offset = (page - 1) * size
            sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([size, offset])
            rows = db.execute(sql, params).fetchall()
            return {
                "total": total,
                "page": page,
                "size": size,
                "items": [self._article_item(r) for r in rows]
            }
        finally:
            db.close()

    def _get_article(self, aid):
        db = get_db()
        try:
            r = db.execute("SELECT * FROM articles WHERE id=?", (aid,)).fetchone()
            if not r:
                return error_response("Not found", 404)
            db.execute("UPDATE articles SET view_count=view_count+1 WHERE id=?", (aid,))
            db.commit()
            r = db.execute("SELECT * FROM articles WHERE id=?", (aid,)).fetchone()
            return {
                "id": r["id"],
                "title": r["title"],
                "summary": r["summary"] or "",
                "content": r["content"] or "",
                "category": r["category"] or "",
                "tags": r["tags"] or "",
                "author": r["author"] or "",
                "cover_image": r["cover_image"] or "",
                "view_count": r["view_count"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
            }
        finally:
            db.close()

    def _article_item(self, r):
        return {
            "id": r["id"],
            "title": r["title"],
            "summary": r["summary"] or "",
            "category": r["category"] or "",
            "tags": r["tags"] or "",
            "author": r["author"] or "",
            "cover_image": r["cover_image"] or "",
            "view_count": r["view_count"],
            "created_at": r["created_at"],
        }


def run():
    port = 8000
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"Wellness API running on http://0.0.0.0:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
