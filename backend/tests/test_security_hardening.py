"""Tests for Milestone 4: OWASP security headers, CORS hardening, and rate limiting."""

from fastapi.testclient import TestClient

from app.core.config import DEFAULT_DEV_SECRET_KEY, settings
from app.core.security_middleware import rate_limiter


def test_security_headers_and_request_id_present(client: TestClient):
    resp = client.get("/health", headers={"X-Request-ID": "trace-abc-123"})
    assert resp.status_code == 200
    assert resp.headers.get("X-Request-ID") == "trace-abc-123"
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in (resp.headers.get("Permissions-Policy") or "")


def test_cors_has_no_wildcard_origin():
    from app.core.config import Settings

    assert "*" not in settings.BACKEND_CORS_ORIGINS
    default_origins = Settings.model_fields["BACKEND_CORS_ORIGINS"].default
    assert "*" not in default_origins
    assert "https://predict-rx-ai.vercel.app" in default_origins
    assert DEFAULT_DEV_SECRET_KEY != ""


def test_auth_rate_limiter_enforces_429_and_resets(client: TestClient):
    rate_limiter.reset()
    original_limit = settings.RATE_LIMIT_AUTH_PER_MIN
    settings.RATE_LIMIT_AUTH_PER_MIN = 2
    try:
        for _ in range(2):
            r = client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "wrongpassword123"})
            assert r.status_code == 401
            assert r.headers.get("Cache-Control") == "no-store"

        blocked = client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "wrongpassword123"})
        assert blocked.status_code == 429
        assert blocked.json()["error"] == "RATE_LIMIT_EXCEEDED"
        assert int(blocked.headers.get("Retry-After", "0")) >= 1
    finally:
        settings.RATE_LIMIT_AUTH_PER_MIN = original_limit
        rate_limiter.reset()
