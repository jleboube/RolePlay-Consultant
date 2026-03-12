from datetime import datetime, timezone

from flask_login import UserMixin

from app.extensions import db


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(256), unique=True, nullable=True)
    microsoft_id = db.Column(db.String(256), unique=True, nullable=True)
    auth_provider = db.Column(db.String(20), nullable=False, default="google")
    email = db.Column(db.String(256), unique=True, nullable=False)
    name = db.Column(db.String(256), nullable=False)
    avatar_url = db.Column(db.String(512), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    preferences = db.Column(db.JSON, default=dict)

    sessions = db.relationship("ChatSession", backref="user", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "avatar_url": self.avatar_url,
            "auth_provider": self.auth_provider,
            "preferences": self.preferences or {},
        }
