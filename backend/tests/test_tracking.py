import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_token(employee_code="EMP101"):
    resp = client.post("/api/auth/login", json={
        "employee_code": employee_code,
        "password": "Password@123"
    })
    return resp.json()["access_token"]


def test_start_duty():
    token = get_auth_token("EMP101")
    resp = client.post(
        "/api/tracking/start",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "start_latitude": 17.4156,
            "start_longitude": 78.4350,
            "start_address": "Banjara Hills",
            "battery_level": 90
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ACTIVE"
    assert data["staff_name"] == "Rahul Kumar"


def test_tracking_status():
    token = get_auth_token("EMP101")
    resp = client.get(
        "/api/tracking/status",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_on_duty"] is True
    assert data["today_distance_km"] >= 0.0


def test_single_location_upload():
    token = get_auth_token("EMP101")
    now_iso = datetime.now(timezone.utc).isoformat()
    resp = client.post(
        "/api/tracking/location",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "latitude": 17.4200,
            "longitude": 78.4300,
            "accuracy": 8.0,
            "speed": 14.5,
            "timestamp": now_iso,
            "battery_level": 88,
            "client_id": f"TEST-PT-{datetime.now().timestamp()}"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["latitude"] == 17.4200
    assert data["longitude"] == 78.4300


def test_get_route():
    token = get_auth_token("EMP101")
    resp = client.get(
        "/api/tracking/route",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "points" in data
    assert len(data["points"]) > 0
