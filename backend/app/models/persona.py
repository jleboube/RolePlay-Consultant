from datetime import datetime, timezone

from app.extensions import db


class PersonaVersion(db.Model):
    __tablename__ = "persona_versions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False, index=True)
    version = db.Column(db.Integer, nullable=False, default=1)
    title = db.Column(db.String(256), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    traits = db.Column(db.JSON, nullable=False, default=list)
    system_prompt = db.Column(db.Text, nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint("name", "version", name="uq_persona_name_version"),
    )

    def to_dict(self, include_prompt=False):
        data = {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "title": self.title,
            "description": self.description,
            "traits": self.traits or [],
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_prompt:
            data["system_prompt"] = self.system_prompt
        return data

    @staticmethod
    def get_latest(name):
        """Get the latest active version of a persona by name."""
        return (
            PersonaVersion.query
            .filter_by(name=name, is_active=True)
            .order_by(PersonaVersion.version.desc())
            .first()
        )

    @staticmethod
    def get_all_latest():
        """Get the latest active version of each persona."""
        subq = (
            db.session.query(
                PersonaVersion.name,
                db.func.max(PersonaVersion.version).label("max_version"),
            )
            .filter(PersonaVersion.is_active == True)
            .group_by(PersonaVersion.name)
            .subquery()
        )
        return (
            PersonaVersion.query
            .join(subq, db.and_(
                PersonaVersion.name == subq.c.name,
                PersonaVersion.version == subq.c.max_version,
            ))
            .order_by(PersonaVersion.name)
            .all()
        )

    @staticmethod
    def get_version_history(name):
        """Get all versions of a persona."""
        return (
            PersonaVersion.query
            .filter_by(name=name)
            .order_by(PersonaVersion.version.desc())
            .all()
        )
