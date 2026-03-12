import os
import logging
from urllib.parse import urlencode

import requests as http_requests
from flask import Blueprint, redirect, url_for, jsonify, session, request, current_app
from flask_login import login_user, logout_user, current_user, login_required
from flask_dance.contrib.google import make_google_blueprint, google

from app.extensions import db, login_manager
from app.models.user import User
from app.models.admin_config import AdminConfig

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)

_domain = os.environ.get("DOMAIN", "localhost")

# --- Google OAuth (Flask-Dance) ---

google_bp = make_google_blueprint(
    client_id=os.environ.get("GOOGLE_CLIENT_ID", ""),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", ""),
    scope=["openid", "email", "profile"],
    redirect_url="/api/auth/callback",
)
auth_bp.register_blueprint(google_bp)


@google_bp.before_request
def set_proxy_headers():
    if request.headers.get("X-Forwarded-Proto") == "https":
        request.environ["wsgi.url_scheme"] = "https"
        request.environ["HTTP_HOST"] = _domain


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Authentication required. Please log in."}), 401


@auth_bp.route("/providers")
def auth_providers():
    """Return which auth providers are available."""
    ms_configured = bool(
        AdminConfig.get("ms_client_id") and
        AdminConfig.get("ms_tenant_id") and
        AdminConfig.get("ms_client_secret")
    )
    return jsonify({
        "google": True,
        "microsoft": ms_configured,
    })


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
        # Check if a user with this email exists (maybe from Microsoft)
        user = User.query.filter_by(email=info["email"]).first()
        if user:
            user.google_id = google_id
        else:
            user = User(
                google_id=google_id,
                auth_provider="google",
                email=info["email"],
                name=info.get("name", info["email"]),
                avatar_url=info.get("picture"),
            )
            db.session.add(user)
        db.session.commit()

    login_user(user)
    return redirect("/chat")


# --- Microsoft OAuth (manual flow, credentials from AdminConfig DB) ---

@auth_bp.route("/login/microsoft")
def login_microsoft():
    if current_user.is_authenticated:
        return redirect("/chat")

    client_id = AdminConfig.get("ms_client_id")
    tenant_id = AdminConfig.get("ms_tenant_id")

    if not client_id or not tenant_id:
        return redirect("/?error=microsoft_not_configured")

    domain = current_app.config.get("DOMAIN", "localhost")
    redirect_uri = f"https://{domain}/api/auth/callback/microsoft"

    params = {
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": "openid email profile User.Read",
        "response_mode": "query",
    }
    auth_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize?{urlencode(params)}"
    return redirect(auth_url)


@auth_bp.route("/callback/microsoft")
def callback_microsoft():
    code = request.args.get("code")
    if not code:
        error = request.args.get("error_description", "Microsoft login failed.")
        logger.error("Microsoft OAuth error: %s", error)
        return redirect("/?error=microsoft_auth_failed")

    client_id = AdminConfig.get("ms_client_id", "")
    client_secret = AdminConfig.get("ms_client_secret", "")
    tenant_id = AdminConfig.get("ms_tenant_id", "")
    domain = current_app.config.get("DOMAIN", "localhost")
    redirect_uri = f"https://{domain}/api/auth/callback/microsoft"

    # Exchange code for token
    token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    token_data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "scope": "openid email profile User.Read",
    }

    try:
        token_resp = http_requests.post(token_url, data=token_data, timeout=30)
        token_resp.raise_for_status()
    except Exception as e:
        logger.error("Microsoft token exchange failed: %s", str(e))
        return redirect("/?error=microsoft_auth_failed")

    access_token = token_resp.json().get("access_token")
    if not access_token:
        return redirect("/?error=microsoft_auth_failed")

    # Get user profile from Microsoft Graph
    try:
        profile_resp = http_requests.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=30,
        )
        profile_resp.raise_for_status()
        profile = profile_resp.json()
    except Exception as e:
        logger.error("Microsoft Graph /me failed: %s", str(e))
        return redirect("/?error=microsoft_auth_failed")

    ms_id = profile.get("id")
    email = profile.get("mail") or profile.get("userPrincipalName", "")
    name = profile.get("displayName", email)

    # Upsert user
    user = User.query.filter_by(microsoft_id=ms_id).first()
    if user is None:
        user = User.query.filter_by(email=email).first()
        if user:
            user.microsoft_id = ms_id
        else:
            user = User(
                microsoft_id=ms_id,
                auth_provider="microsoft",
                email=email,
                name=name,
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
