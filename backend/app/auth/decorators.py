from functools import wraps

from flask_login import current_user
from flask_socketio import disconnect, emit


def ws_login_required(f):
    """Decorator for SocketIO event handlers that require authentication."""

    @wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            emit("error", {"message": "Authentication required."})
            disconnect()
            return
        return f(*args, **kwargs)

    return wrapped
