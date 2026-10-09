import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_token(employee_code="EMP102"):
    resp = client.post("/api/auth/login", json={
        "employee_code": employee_code,
        "password": "Password@123"
    })
    return resp.json()["access_token"]


def test_batch_location_upload_and_deduplication():
    token = get_auth_token("EMP102")
    now = datetime.now(timezone.utc)

    # 1. First upload a batch of 3 points
    test_client_id_1 = f"OFFLINE-PT-1-{now.timestamp()}"
    test_client_id_2 = f"OFFLINE-PT-2-{now.timestamp()}"
    test_client_id_3 = f"OFFLINE-PT-3-{now.timestamp()}"

    batch_payload = {
        "locations": [
            {
                "client_id": test_client_id_1,
                "latitude": 17.4400,
                "longitude": 78.4900,
                "accuracy": 7.5,
                "speed": 10.0,
                "timestamp": (now - timedelta(minutes=4)).isoformat(),
                "battery_level": 85
            },
            {
                "client_id": test_client_id_2,
                "latitude": 17.4450,
                "longitude": 78.4850,
                "accuracy": 8.0,
                "speed": 12.0,
                "timestamp": (now - timedelta(minutes=2)).isoformat(),
                "battery_level": 84
            },
            {
                "client_id": test_client_id_3,
                "latitude": 17.4500,
                "longitude": 78.4800,
                "accuracy": 6.5,
                "speed": 15.0,
                "timestamp": now.isoformat(),
                "battery_level": 83
            }
        ]
    }

    resp1 = client.post(
        "/api/tracking/batch",
        headers={"Authorization": f"Bearer {token}"},
        json=batch_payload
    )
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["total_received"] == 3
    assert data1["total_accepted"] == 3
    assert data1["skipped_duplicates"] == 0

    # 2. Resend the same batch (simulating mobile retry on flaky network)
    resp2 = client.post(
        "/api/tracking/batch",
        headers={"Authorization": f"Bearer {token}"},
        json=batch_payload
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["total_received"] == 3
    # All 3 were already recognized as duplicates
    assert data2["skipped_duplicates"] == 3


def test_anomaly_detection_on_impossible_jump():
    token = get_auth_token("EMP102")
    
    # Get current status to find last GPS timestamp
    status_resp = client.get(
        "/api/tracking/status",
        headers={"Authorization": f"Bearer {token}"}
    )
    last_gps = status_resp.json().get("last_gps_update")
    if last_gps:
        base_time = datetime.fromisoformat(last_gps)
    else:
        base_time = datetime.now(timezone.utc)

    # Send a point in Bangalore 10 seconds after the last point in Hyderabad
    jump_time = (base_time + timedelta(seconds=10)).isoformat()
    resp = client.post(
        "/api/tracking/location",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "latitude": 12.9716, # Bangalore
            "longitude": 77.5946,
            "accuracy": 10.0,
            "speed": 20.0,
            "timestamp": jump_time,
            "battery_level": 80,
            "client_id": f"ANOMALY-JUMP-{datetime.now().timestamp()}"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_anomaly"] is True
    assert "Impossible jump" in data["anomaly_reason"] or "Unrealistic movement" in data["anomaly_reason"]
