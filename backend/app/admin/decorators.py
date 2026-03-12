from functools import wraps

from flask import session, jsonify


def admin_required(f):
    """Decorator that requires an active admin session."""

    @wraps(f)
    def wrapped(*args, **kwargs):
        if not session.get("is_admin"):
            return jsonify({"error": "Admin authentication required."}), 401
        return f(*args, **kwargs)

    return wrapped
