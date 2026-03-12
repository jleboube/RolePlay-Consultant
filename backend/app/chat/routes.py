import os

from flask import Blueprint, jsonify, request, Response
from flask_login import login_required, current_user
from openai import OpenAI

from app.models.session import ChatSession
from app.orchestrator.personas import PersonaRegistry

chat_bp = Blueprint("chat", __name__)

VALID_TTS_VOICES = {"alloy", "ash", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"}


@chat_bp.route("/health")
def health():
    return jsonify({"status": "ok"})


@chat_bp.route("/personas")
@login_required
def list_personas():
    try:
        from app.models.persona import PersonaVersion
        db_personas = PersonaVersion.get_all_latest()
        if db_personas:
            return jsonify([p.to_dict() for p in db_personas])
    except Exception:
        pass
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


@chat_bp.route("/tts", methods=["POST"])
@login_required
def text_to_speech():
    data = request.get_json()
    if not data or not data.get("text"):
        return jsonify({"error": "Text is required."}), 400

    text = data["text"]
    voice = data.get("voice", "nova")
    if voice not in VALID_TTS_VOICES:
        voice = "nova"

    try:
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            response_format="mp3",
        )

        def generate():
            for chunk in response.iter_bytes(chunk_size=4096):
                yield chunk

        return Response(generate(), mimetype="audio/mpeg")
    except Exception as e:
        return jsonify({"error": f"TTS generation failed: {str(e)}"}), 500
