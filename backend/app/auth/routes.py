import os

from flask import Blueprint, redirect, url_for, jsonify, session
from flask_login import login_user, logout_user, current_user, login_required
from flask_dance.contrib.google import make_google_blueprint, google

from app.extensions import db, login_manager
from app.models.user import User

auth_bp = Blueprint("auth", __name__)

google_bp = make_google_blueprint(
    client_id=os.environ.get("GOOGLE_CLIENT_ID", ""),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", ""),
    scope=["openid", "email", "profile"],
    redirect_url="/api/auth/callback",
)
auth_bp.register_blueprint(google_bp, url_prefix="/google")


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Authentication required. Please log in."}), 401


@auth_bp.route("/login")
def login():
    if current_user.is_authenticated:
        return redirect("/chat")
    return redirect(url_for("auth.google.login"))


@auth_bp.route("/callback")
def callback():
    if not google.authorized:
        return redirect("/")

    resp = google.get("/oauth2/v2/userinfo")
    if not resp.ok:
        return redirect("/")

    info = resp.json()
    google_id = info["id"]

    user = User.query.filter_by(google_id=google_id).first()
    if user is None:
        user = User(
            google_id=google_id,
            email=info["email"],
            name=info.get("name", info["email"]),
            avatar_url=info.get("picture"),
        )
        db.session.add(user)
        db.session.commit()

    login_user(user)
    return redirect("/chat")


@auth_bp.route("/me")
def me():
    if not current_user.is_authenticated:
        return jsonify({"authenticated": False}), 401
    return jsonify({"authenticated": True, "user": current_user.to_dict()})


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    session.clear()
    return jsonify({"message": "Logged out successfully."})
