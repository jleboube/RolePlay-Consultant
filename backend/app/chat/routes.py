from flask import Blueprint, jsonify

from flask_login import login_required, current_user

from app.models.session import ChatSession
from app.orchestrator.personas import PersonaRegistry

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/health")
def health():
    return jsonify({"status": "ok"})


@chat_bp.route("/personas")
@login_required
def list_personas():
    personas = PersonaRegistry.list_all()
    return jsonify([p.to_dict() for p in personas])


@chat_bp.route("/sessions")
@login_required
def list_sessions():
    sessions = (
        ChatSession.query.filter_by(user_id=current_user.id)
        .order_by(ChatSession.started_at.desc())
        .all()
    )
    return jsonify([s.to_dict() for s in sessions])


@chat_bp.route("/sessions/<int:session_id>")
@login_required
def get_session(session_id):
    chat_session = ChatSession.query.filter_by(
        id=session_id, user_id=current_user.id
    ).first()
    if not chat_session:
        return jsonify({"error": "Session not found."}), 404
    return jsonify(chat_session.to_dict(include_messages=True))
