"""Test authentication and user registration endpoints."""

import uuid
from fastapi.testclient import TestClient


def test_login_successful(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "doctor@predictrx.bd", "password": "Doctor123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "doctor@predictrx.bd"
    assert data["user"]["role"] == "doctor"


def test_login_invalid_password(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "doctor@predictrx.bd", "password": "WrongPassword999!"},
    )
    assert response.status_code == 401


def test_get_current_user_profile(client: TestClient, auth_headers: dict):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "doctor@predictrx.bd"
    assert data["full_name"] == "Dr. Rafiqul Islam"


def test_register_new_clinician(client: TestClient):
    unique_email = f"dr.test_{uuid.uuid4().hex[:6]}@predictrx.bd"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": "SecurePassword123!",
            "full_name": "Dr. Test User",
            "role": "doctor",
            "bmdc_number": "A-99999",
            "department": "Cardiology",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == unique_email
    assert data["bmdc_number"] == "A-99999"
