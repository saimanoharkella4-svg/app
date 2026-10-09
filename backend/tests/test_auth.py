import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_staff_login_success():
    response = client.post("/api/auth/login", json={
        "employee_code": "EMP101",
        "password": "Password@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["employee_code"] == "EMP101"
    assert data["user"]["name"] == "Rahul Kumar"


def test_admin_login_success():
    response = client.post("/api/auth/login", json={
        "employee_code": "ADMIN001",
        "password": "Password@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "ADMIN"


def test_login_invalid_credentials():
    response = client.post("/api/auth/login", json={
        "employee_code": "EMP101",
        "password": "WrongPassword"
    })
    assert response.status_code == 401


def test_get_current_profile():
    # Login first
    login_resp = client.post("/api/auth/login", json={
        "employee_code": "EMP101",
        "password": "Password@123"
    })
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["employee_code"] == "EMP101"


def test_removed_roles_not_present():
    from app.models.staff import StaffRole
    role_values = [r.value for r in StaffRole]
    assert "TEAM_MANAGER" not in role_values
    assert "HR" not in role_values
    assert "VIEWER" not in role_values
    assert "TEAM_MGR" not in role_values
    assert "USER" in role_values
    assert "ADMIN" in role_values


def test_schedule_today_and_tracking_geofence():
    # Login as Rahul
    login_resp = client.post("/api/auth/login", json={
        "employee_code": "EMP101",
        "password": "Password@123"
    })
    token = login_resp.json()["access_token"]

    # 1. Test Schedule Today endpoint
    sched_resp = client.get(
        "/api/schedule/today",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert sched_resp.status_code == 200
    sched = sched_resp.json()
    assert "location_name" in sched
    assert "geofence_radius_meters" in sched
    assert sched["geofence_radius_meters"] == 200

    # 2. Test Tracking Status with Planned vs Actual geofence comparison
    status_resp = client.get(
        "/api/tracking/status",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert status_resp.status_code == 200
    st = status_resp.json()
    assert "assigned_location" in st
    assert "current_status" in st
    assert "geofence_radius_meters" in st
    assert st["tracking_status"] in ["Active", "Inactive"]


def test_create_staff_with_removed_role_rejected():
    # Login as admin
    admin_login = client.post("/api/auth/login", json={
        "employee_code": "ADMIN001",
        "password": "Password@123"
    })
    token = admin_login.json()["access_token"]

    for invalid_role in ["HR", "VIEWER", "TEAM_MGR", "TEAM_MANAGER"]:
        resp = client.post(
            "/api/staff",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "employee_code": f"TEST_{invalid_role}",
                "name": f"Test {invalid_role}",
                "phone": "+91 99999 88888",
                "email": f"test_{invalid_role.lower()}@extrahand.in",
                "password": "Password@123",
                "role": invalid_role
            }
        )
        assert resp.status_code == 400
        assert "Invalid role" in resp.json()["detail"]


def test_admin_access_allowed():
    admin_login = client.post("/api/auth/login", json={
        "employee_code": "ADMIN001",
        "password": "Password@123"
    })
    assert admin_login.status_code == 200
    token = admin_login.json()["access_token"]
    assert admin_login.json()["user"]["role"] == "ADMIN"

    resp = client.get(
        "/api/admin/overview-stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200


def test_field_staff_denied_admin_access():
    staff_login = client.post("/api/auth/login", json={
        "employee_code": "EMP101",
        "password": "Password@123"
    })
    token = staff_login.json()["access_token"]

    resp = client.get(
        "/api/admin/overview-stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 403

