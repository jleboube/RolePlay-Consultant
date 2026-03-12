from datetime import datetime, timezone

from app.extensions import db


class OneDriveFolder(db.Model):
    __tablename__ = "onedrive_folders"

    id = db.Column(db.Integer, primary_key=True)
    folder_id = db.Column(db.String(512), nullable=False)
    folder_path = db.Column(db.String(1024), nullable=False)
    persona = db.Column(db.String(64), nullable=True)
    sync_status = db.Column(db.String(20), default="pending")
    last_synced_at = db.Column(db.DateTime, nullable=True)
    cached_content = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "folder_id": self.folder_id,
            "folder_path": self.folder_path,
            "persona": self.persona,
            "sync_status": self.sync_status,
            "last_synced_at": self.last_synced_at.isoformat() if self.last_synced_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
