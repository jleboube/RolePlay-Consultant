from datetime import datetime, timezone

from app.extensions import db


class ChatSession(db.Model):
    __tablename__ = "chat_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    persona = db.Column(db.String(64), nullable=False)
    started_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = db.Column(db.DateTime, nullable=True)
    feedback = db.Column(db.JSON, nullable=True)
    status = db.Column(db.String(20), default="active")

    messages = db.relationship(
        "Message", backref="session", lazy="dynamic", order_by="Message.timestamp"
    )

    def to_dict(self, include_messages=False):
        data = {
            "id": self.id,
            "persona": self.persona,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "feedback": self.feedback,
            "status": self.status,
        }
        if include_messages:
            data["messages"] = [m.to_dict() for m in self.messages.all()]
        return data


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(
        db.Integer, db.ForeignKey("chat_sessions.id"), nullable=False
    )
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
