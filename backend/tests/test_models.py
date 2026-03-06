from app.models.user import User
from app.models.session import ChatSession, Message


def test_create_user(app, db):
    user = User(google_id="g123", email="alice@test.com", name="Alice")
    db.session.add(user)
    db.session.commit()

    assert user.id is not None
    assert user.email == "alice@test.com"
    assert user.to_dict()["name"] == "Alice"


def test_create_session_and_messages(app, db, test_user):
    session = ChatSession(user_id=test_user.id, persona="cto")
    db.session.add(session)
    db.session.commit()

    msg1 = Message(session_id=session.id, role="user", content="Hello")
    msg2 = Message(session_id=session.id, role="assistant", content="Hi there")
    db.session.add_all([msg1, msg2])
    db.session.commit()

    assert session.id is not None
    assert session.messages.count() == 2

    data = session.to_dict(include_messages=True)
    assert len(data["messages"]) == 2
    assert data["persona"] == "cto"
    assert data["status"] == "active"


def test_user_sessions_relationship(app, db, test_user):
    s1 = ChatSession(user_id=test_user.id, persona="cto")
    s2 = ChatSession(user_id=test_user.id, persona="sr_vp_software")
    db.session.add_all([s1, s2])
    db.session.commit()

    assert test_user.sessions.count() == 2
