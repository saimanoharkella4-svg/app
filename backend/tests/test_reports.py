import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_admin_token():
    resp = client.post("/api/auth/login", json={
        "employee_code": "ADMIN001",
        "password": "Password@123"
    })
    return resp.json()["access_token"]


def test_get_daily_reports():
    token = get_admin_token()
    resp = client.get(
        "/api/reports/daily",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    item = data[0]
    assert "working_hours_formatted" in item
    assert "distance_km" in item


def test_get_weekly_reports():
    token = get_admin_token()
    resp = client.get(
        "/api/reports/weekly",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_excel_export_download():
    token = get_admin_token()
    resp = client.get(
        "/api/reports/export/excel",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in resp.headers["content-type"]
    assert len(resp.content) > 1000  # Non-empty Excel file


def test_pdf_export_download():
    token = get_admin_token()
    resp = client.get(
        "/api/reports/export/pdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert len(resp.content) > 1000  # Non-empty PDF file
    assert resp.content.startswith(b"%PDF") # Valid PDF header
