from datetime import datetime, timezone

from app.extensions import db


class AdminConfig(db.Model):
    __tablename__ = "admin_config"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(128), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    @staticmethod
    def get(key, default=None):
        row = AdminConfig.query.filter_by(key=key).first()
        return row.value if row else default

    @staticmethod
    def set(key, value):
        row = AdminConfig.query.filter_by(key=key).first()
        if row:
            row.value = value
        else:
            row = AdminConfig(key=key, value=value)
            db.session.add(row)
        db.session.commit()
        return row
