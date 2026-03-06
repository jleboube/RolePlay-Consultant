from flask_login import login_user


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json["status"] == "ok"


def test_personas_requires_auth(client):
    response = client.get("/api/personas")
    assert response.status_code == 401


def test_sessions_requires_auth(client):
    response = client.get("/api/sessions")
    assert response.status_code == 401


def test_list_personas_authenticated(app, client, test_user):
    with client.session_transaction() as sess:
        sess["_user_id"] = str(test_user.id)

    response = client.get("/api/personas")
    assert response.status_code == 200
    data = response.json
    assert isinstance(data, list)
    assert len(data) >= 2


def test_list_sessions_empty(app, client, test_user):
    with client.session_transaction() as sess:
        sess["_user_id"] = str(test_user.id)

    response = client.get("/api/sessions")
    assert response.status_code == 200
    assert response.json == []


def test_get_session_not_found(app, client, test_user):
    with client.session_transaction() as sess:
        sess["_user_id"] = str(test_user.id)

    response = client.get("/api/sessions/999")
    assert response.status_code == 404
