import logging
import os
from datetime import datetime, timezone

from flask_login import current_user
from flask_socketio import emit
from openai import OpenAI

from app.extensions import db, socketio
from app.auth.decorators import ws_login_required
from app.models.session import ChatSession, Message
from app.orchestrator.orchestrator import Orchestrator
from app.orchestrator.feedback import FeedbackGenerator

logger = logging.getLogger(__name__)

# Active orchestrators keyed by session_id
active_orchestrators: dict[int, Orchestrator] = {}


def _get_openai_client():
    return OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


def _save_message(session_id: int, role: str, content: str):
    msg = Message(session_id=session_id, role=role, content=content)
    db.session.add(msg)
    db.session.commit()
    return msg


@socketio.on("connect")
def handle_connect():
    if not current_user.is_authenticated:
        return False
    logger.info("User %s connected via WebSocket", current_user.id)


@socketio.on("disconnect")
def handle_disconnect():
    logger.info("WebSocket disconnected")


@socketio.on("start_session")
@ws_login_required
def handle_start_session(data):
    persona_name = data.get("persona")
    if not persona_name:
        emit("error", {"message": "Persona selection is required."})
        return

    try:
        client = _get_openai_client()
        session = ChatSession(user_id=current_user.id, persona=persona_name)
        db.session.add(session)
        db.session.commit()

        orchestrator = Orchestrator(persona_name, client, session.id)
        active_orchestrators[session.id] = orchestrator

        greeting = orchestrator.process_message(
            "[System: The user has just joined the meeting. "
            "Greet them in character and set the scene for the conversation.]"
        )
        _save_message(session.id, "assistant", greeting)

        emit(
            "session_started",
            {"session_id": session.id, "greeting": greeting},
        )
    except ValueError as e:
        emit("error", {"message": str(e)})
    except RuntimeError as e:
        emit("error", {"message": str(e)})


@socketio.on("send_message")
@ws_login_required
def handle_send_message(data):
    session_id = data.get("session_id")
    content = data.get("content", "").strip()

    if not session_id or not content:
        emit("error", {"message": "Session ID and message content are required."})
        return

    chat_session = ChatSession.query.filter_by(
        id=session_id, user_id=current_user.id, status="active"
    ).first()
    if not chat_session:
        emit("error", {"message": "Active session not found."})
        return

    _save_message(session_id, "user", content)

    orchestrator = active_orchestrators.get(session_id)
    if not orchestrator:
        try:
            client = _get_openai_client()
            orchestrator = Orchestrator(chat_session.persona, client, session_id)
            existing_messages = [
                {"role": m.role, "content": m.content}
                for m in chat_session.messages.all()
            ]
            orchestrator.load_history(existing_messages)
            active_orchestrators[session_id] = orchestrator
        except Exception as e:
            emit("error", {"message": f"Failed to resume session: {str(e)}"})
            return

    try:
        response = orchestrator.process_message(content)
        _save_message(session_id, "assistant", response)
        emit(
            "ai_response",
            {"session_id": session_id, "content": response, "done": True},
        )
    except RuntimeError as e:
        emit("error", {"message": str(e)})


@socketio.on("end_session")
@ws_login_required
def handle_end_session(data):
    session_id = data.get("session_id")
    if not session_id:
        emit("error", {"message": "Session ID is required."})
        return

    chat_session = ChatSession.query.filter_by(
        id=session_id, user_id=current_user.id
    ).first()
    if not chat_session:
        emit("error", {"message": "Session not found."})
        return

    messages = [
        {"role": m.role, "content": m.content} for m in chat_session.messages.all()
    ]

    feedback = {}
    if len(messages) >= 2:
        try:
            client = _get_openai_client()
            from app.orchestrator.personas import PersonaRegistry

            persona = PersonaRegistry.get(chat_session.persona)
            generator = FeedbackGenerator(client)
            feedback = generator.generate(persona, messages)
        except Exception as e:
            logger.error("Feedback generation failed: %s", str(e))
            feedback = {"summary": "Feedback could not be generated.", "score": 0}

    chat_session.status = "completed"
    chat_session.ended_at = datetime.now(timezone.utc)
    chat_session.feedback = feedback
    db.session.commit()

    active_orchestrators.pop(session_id, None)

    emit("session_ended", {"session_id": session_id, "feedback": feedback})
