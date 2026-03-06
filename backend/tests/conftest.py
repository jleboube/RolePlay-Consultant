import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db as _db
from app.models.user import User


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(app):
    return _db


@pytest.fixture
def test_user(app, db):
    user = User(
        google_id="test-google-123",
        email="test@example.com",
        name="Test User",
    )
    db.session.add(user)
    db.session.commit()
    return user
