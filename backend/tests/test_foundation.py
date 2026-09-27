import pytest

def test_healthcheck(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "AURA API"

def test_get_current_user(client):
    response = client.get("/api/v1/user/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "alex.chen@aura.ai"
    assert data["full_name"] == "Alex Chen"
    assert data["profile"] is not None
    assert data["security_settings"] is not None

def test_list_calls(client):
    response = client.get("/api/v1/calls")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4
    categories = [c["category"] for c in data]
    assert "INTERVIEW" in categories
    assert "EMERGENCY" in categories
    assert "SPAM" in categories
    assert "BUSINESS" in categories

def test_call_detail(client):
    calls_res = client.get("/api/v1/calls")
    calls = calls_res.json()
    first_call_id = calls[0]["id"]

    detail_res = client.get(f"/api/v1/calls/{first_call_id}")
    assert detail_res.status_code == 200
    data = detail_res.json()
    assert data["id"] == first_call_id
    assert "transcripts" in data

def test_emergency_events_and_pin_dismissal(client):
    events_res = client.get("/api/v1/emergency/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) >= 1
    emergency_event = events[0]

    # Test invalid PIN
    bad_pin_res = client.post("/api/v1/emergency/dismiss", json={
        "emergency_id": emergency_event["id"],
        "pin": "9999",
        "dismissed_by": "Alex Chen"
    })
    assert bad_pin_res.status_code == 403

    # Test valid PIN (default 1234)
    good_pin_res = client.post("/api/v1/emergency/dismiss", json={
        "emergency_id": emergency_event["id"],
        "pin": "1234",
        "dismissed_by": "Alex Chen"
    })
    assert good_pin_res.status_code == 200
    assert good_pin_res.json()["event_id"] == emergency_event["id"]

def test_action_items(client):
    res = client.get("/api/v1/action-items")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    first_item = items[0]

    # Toggle completed
    toggle_res = client.patch(f"/api/v1/action-items/{first_item['id']}", json={
        "is_completed": True
    })
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_completed"] is True
