import json
import logging

from flask import Blueprint, jsonify, request, session, current_app

from app.extensions import db
from app.admin.decorators import admin_required
from app.models.user import User
from app.models.session import ChatSession
from app.models.admin_config import AdminConfig
from app.models.onedrive import OneDriveFolder
from app.models.persona import PersonaVersion

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    password = data.get("password", "") if data else ""
    expected = current_app.config.get("ADMIN_PASSWORD", "")

    if not expected or password != expected:
        return jsonify({"error": "Invalid admin password."}), 401

    session["is_admin"] = True
    return jsonify({"authenticated": True})


@admin_bp.route("/logout", methods=["POST"])
def admin_logout():
    session.pop("is_admin", None)
    return jsonify({"message": "Admin logged out."})


@admin_bp.route("/me")
def admin_me():
    if session.get("is_admin"):
        return jsonify({"authenticated": True})
    return jsonify({"authenticated": False}), 401


@admin_bp.route("/users")
@admin_required
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@admin_bp.route("/report-cards")
@admin_required
def list_report_cards():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    user_id = request.args.get("user_id", type=int)
    persona = request.args.get("persona")

    query = ChatSession.query.filter(ChatSession.status == "completed")

    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    if persona:
        query = query.filter(ChatSession.persona == persona)

    query = query.order_by(ChatSession.ended_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    results = []
    for s in pagination.items:
        user = db.session.get(User, s.user_id)
        results.append({
            "session": s.to_dict(),
            "user": user.to_dict() if user else None,
        })

    return jsonify({
        "items": results,
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    })


@admin_bp.route("/report-cards/<int:session_id>")
@admin_required
def get_report_card(session_id):
    chat_session = ChatSession.query.get(session_id)
    if not chat_session:
        return jsonify({"error": "Session not found."}), 404

    user = db.session.get(User, chat_session.user_id)
    return jsonify({
        "session": chat_session.to_dict(include_messages=True),
        "user": user.to_dict() if user else None,
    })


# --- Microsoft OAuth Config ---

@admin_bp.route("/config/microsoft")
@admin_required
def get_microsoft_config():
    client_id = AdminConfig.get("ms_client_id", "")
    tenant_id = AdminConfig.get("ms_tenant_id", "")
    client_secret = AdminConfig.get("ms_client_secret", "")

    return jsonify({
        "client_id": client_id,
        "tenant_id": tenant_id,
        "has_secret": bool(client_secret),
        "is_configured": bool(client_id and tenant_id and client_secret),
    })


@admin_bp.route("/config/microsoft", methods=["PUT"])
@admin_required
def save_microsoft_config():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required."}), 400

    if data.get("client_id"):
        AdminConfig.set("ms_client_id", data["client_id"].strip())
    if data.get("tenant_id"):
        AdminConfig.set("ms_tenant_id", data["tenant_id"].strip())
    if data.get("client_secret"):
        AdminConfig.set("ms_client_secret", data["client_secret"].strip())

    return jsonify({"message": "Microsoft configuration saved."})


# --- OneDrive Folders ---

@admin_bp.route("/onedrive/folders")
@admin_required
def list_onedrive_folders():
    folders = OneDriveFolder.query.order_by(OneDriveFolder.created_at.desc()).all()
    return jsonify([f.to_dict() for f in folders])


@admin_bp.route("/onedrive/folders", methods=["POST"])
@admin_required
def add_onedrive_folder():
    data = request.get_json()
    if not data or not data.get("folder_path"):
        return jsonify({"error": "folder_path is required."}), 400

    folder = OneDriveFolder(
        folder_id=data.get("folder_id", ""),
        folder_path=data["folder_path"],
        persona=data.get("persona"),
    )
    db.session.add(folder)
    db.session.commit()
    return jsonify(folder.to_dict()), 201


@admin_bp.route("/onedrive/folders/<int:folder_id>", methods=["DELETE"])
@admin_required
def delete_onedrive_folder(folder_id):
    folder = OneDriveFolder.query.get(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found."}), 404

    db.session.delete(folder)
    db.session.commit()
    return jsonify({"message": "Folder removed."})


@admin_bp.route("/onedrive/folders/<int:folder_id>/sync", methods=["POST"])
@admin_required
def sync_onedrive_folder(folder_id):
    folder = OneDriveFolder.query.get(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found."}), 404

    from app.admin.onedrive_service import OneDriveService

    access_token = AdminConfig.get("ms_onedrive_access_token")
    refresh_token = AdminConfig.get("ms_onedrive_refresh_token")

    if not access_token:
        return jsonify({"error": "OneDrive not connected. Please connect first."}), 400

    try:
        service = OneDriveService(
            client_id=AdminConfig.get("ms_client_id", ""),
            client_secret=AdminConfig.get("ms_client_secret", ""),
            tenant_id=AdminConfig.get("ms_tenant_id", ""),
            access_token=access_token,
            refresh_token=refresh_token,
        )
        content = service.sync_folder(folder)
        folder.cached_content = content
        folder.sync_status = "synced"
        from datetime import datetime, timezone
        folder.last_synced_at = datetime.now(timezone.utc)
        db.session.commit()

        # Save refreshed tokens if updated
        if service.access_token != access_token:
            AdminConfig.set("ms_onedrive_access_token", service.access_token)
        if service.refresh_token != refresh_token:
            AdminConfig.set("ms_onedrive_refresh_token", service.refresh_token)

        return jsonify({"message": "Folder synced successfully.", "folder": folder.to_dict()})
    except Exception as e:
        logger.error("OneDrive sync failed: %s", str(e))
        folder.sync_status = "error"
        db.session.commit()
        return jsonify({"error": f"Sync failed: {str(e)}"}), 500


# --- OneDrive OAuth Connect ---

@admin_bp.route("/onedrive/connect")
@admin_required
def onedrive_connect():
    """Redirect admin to Microsoft consent to grant OneDrive access."""
    from app.admin.onedrive_service import OneDriveService

    client_id = AdminConfig.get("ms_client_id", "")
    tenant_id = AdminConfig.get("ms_tenant_id", "")

    if not client_id or not tenant_id:
        return jsonify({"error": "Microsoft config not set. Configure it first."}), 400

    domain = current_app.config.get("DOMAIN", "localhost")
    redirect_uri = f"https://{domain}/api/admin/onedrive/callback"

    auth_url = OneDriveService.get_auth_url(client_id, tenant_id, redirect_uri)
    return jsonify({"auth_url": auth_url})


@admin_bp.route("/onedrive/callback")
def onedrive_callback():
    """Handle the OAuth callback from Microsoft for OneDrive access."""
    if not session.get("is_admin"):
        return jsonify({"error": "Admin authentication required."}), 401

    code = request.args.get("code")
    if not code:
        error = request.args.get("error_description", "Authorization failed.")
        return f"<html><body><h2>Error</h2><p>{error}</p></body></html>", 400

    from app.admin.onedrive_service import OneDriveService

    client_id = AdminConfig.get("ms_client_id", "")
    client_secret = AdminConfig.get("ms_client_secret", "")
    tenant_id = AdminConfig.get("ms_tenant_id", "")
    domain = current_app.config.get("DOMAIN", "localhost")
    redirect_uri = f"https://{domain}/api/admin/onedrive/callback"

    try:
        tokens = OneDriveService.exchange_code(
            client_id, client_secret, tenant_id, redirect_uri, code
        )
        AdminConfig.set("ms_onedrive_access_token", tokens["access_token"])
        AdminConfig.set("ms_onedrive_refresh_token", tokens.get("refresh_token", ""))

        return '<html><body><h2>OneDrive Connected</h2><p>You can close this window and return to the admin panel.</p><script>window.close();</script></body></html>'
    except Exception as e:
        logger.error("OneDrive OAuth callback failed: %s", str(e))
        return f"<html><body><h2>Error</h2><p>{str(e)}</p></body></html>", 500


# --- Persona Management ---

@admin_bp.route("/personas")
@admin_required
def list_personas():
    """List all personas (latest active version of each)."""
    personas = PersonaVersion.get_all_latest()
    return jsonify([p.to_dict(include_prompt=True) for p in personas])


@admin_bp.route("/personas/<string:name>")
@admin_required
def get_persona(name):
    """Get the latest active version of a persona."""
    persona = PersonaVersion.get_latest(name)
    if not persona:
        return jsonify({"error": "Persona not found."}), 404
    return jsonify(persona.to_dict(include_prompt=True))


@admin_bp.route("/personas/<string:name>/versions")
@admin_required
def get_persona_versions(name):
    """Get all versions of a persona."""
    versions = PersonaVersion.get_version_history(name)
    if not versions:
        return jsonify({"error": "Persona not found."}), 404
    return jsonify([v.to_dict(include_prompt=True) for v in versions])


@admin_bp.route("/personas", methods=["POST"])
@admin_required
def create_persona():
    """Create a brand-new persona (version 1)."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required."}), 400

    name = data.get("name", "").strip()
    title = data.get("title", "").strip()
    system_prompt = data.get("system_prompt", "").strip()

    if not name or not title or not system_prompt:
        return jsonify({"error": "name, title, and system_prompt are required."}), 400

    existing = PersonaVersion.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": f"Persona '{name}' already exists. Use PUT to update."}), 409

    persona = PersonaVersion(
        name=name,
        version=1,
        title=title,
        description=data.get("description", ""),
        traits=data.get("traits", []),
        system_prompt=system_prompt,
        is_active=True,
    )
    db.session.add(persona)
    db.session.commit()
    return jsonify(persona.to_dict(include_prompt=True)), 201


@admin_bp.route("/personas/<string:name>", methods=["PUT"])
@admin_required
def update_persona(name):
    """Update a persona by creating a new version."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required."}), 400

    current = PersonaVersion.get_latest(name)
    if not current:
        return jsonify({"error": "Persona not found."}), 404

    new_version = PersonaVersion(
        name=name,
        version=current.version + 1,
        title=data.get("title", current.title),
        description=data.get("description", current.description),
        traits=data.get("traits", current.traits),
        system_prompt=data.get("system_prompt", current.system_prompt),
        is_active=True,
    )
    db.session.add(new_version)
    db.session.commit()
    return jsonify(new_version.to_dict(include_prompt=True))


@admin_bp.route("/personas/<string:name>", methods=["DELETE"])
@admin_required
def deactivate_persona(name):
    """Deactivate all versions of a persona."""
    versions = PersonaVersion.query.filter_by(name=name).all()
    if not versions:
        return jsonify({"error": "Persona not found."}), 404

    for v in versions:
        v.is_active = False
    db.session.commit()
    return jsonify({"message": f"Persona '{name}' deactivated."})
