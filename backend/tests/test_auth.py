def test_me_unauthenticated(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json["authenticated"] is False


def test_me_authenticated(app, client, test_user):
    with client.session_transaction() as sess:
        sess["_user_id"] = str(test_user.id)

    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json["authenticated"] is True
    assert response.json["user"]["email"] == "test@example.com"


def test_logout_unauthenticated(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 401
