"""Test health and diagnostics endpoints."""

from fastapi.testclient import TestClient


def test_root_status(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "PredictRx-AI (PredictRx BD)"
    assert data["status"] == "operational"


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["api_status"] == "online"
    assert data["database_status"] == "connected"
    assert "disclaimer" in data


def test_api_v1_health(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["api_status"] == "online"
    assert data["database_status"] == "connected"


def test_readiness_probe(client: TestClient):
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True
    assert data["checks"]["database"] is True
    assert data["checks"]["dgda_catalog_count"] >= 400
    assert data["checks"]["ml_model_loaded"] is True
