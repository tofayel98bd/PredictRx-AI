"""Pytest fixtures for PredictRx-AI backend test suite."""

import sys
from pathlib import Path
from typing import Generator
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """Test client for executing HTTP requests against FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def db_session():
    """SQLAlchemy session for direct database verification in tests."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def auth_headers(client: TestClient) -> dict:
    """Fixture providing valid JWT authentication headers for clinician."""
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "doctor@predictrx.bd", "password": "Doctor123!"},
    )
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return {}
