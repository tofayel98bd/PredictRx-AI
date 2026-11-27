"""Tests for Milestone 1: Vision OCR resilience, degraded fallback, and upload limits."""

import json
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.core.config import settings


def test_analyze_graceful_degraded_fallback_preserves_current_medications(client: TestClient):
    """When Vision OCR hits 429 quota on an unknown image, clinician-entered medications are still analyzed."""
    patient_context = {
        "name": "Custom Test Patient",
        "age": 66,
        "gender": "Male",
        "egfr": 29.0,
        "conditions": ["CKD Stage 4"],
        "current_medications": ["Rolac 10 (1+0+1)", "Bizoran 5/20 (1+0+0)"],
    }
    files = {"prescription_file": ("unknown_handwritten_rx_999.jpg", b"arbitrary-image-bytes-xyz", "image/jpeg")}
    data = {"patient_context": json.dumps(patient_context)}

    with patch("app.api.v1.endpoints.predict_rx.analyze_prescription_image", side_effect=RuntimeError("429 RESOURCE_EXHAUSTED")):
        resp = client.post("/api/v1/predict-rx/analyze", files=files, data=data)

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "COMPLETED"
    assert len(body["extracted_prescription"]) == 2
    assert any(a["code"] == "OCR_DEGRADED_FALLBACK" for a in body["prescription_level_alerts"])
    assert body["clinical_risk"]["risk_score"] >= 70


def test_analyze_rejects_empty_or_oversized_upload(client: TestClient):
    """Empty uploads return 400 and oversized uploads return 413."""
    empty_resp = client.post(
        "/api/v1/predict-rx/analyze",
        files={"prescription_file": ("empty.jpg", b"", "image/jpeg")},
    )
    assert empty_resp.status_code == 400

    oversized = b"x" * (settings.MAX_UPLOAD_SIZE_BYTES + 1)
    big_resp = client.post(
        "/api/v1/predict-rx/analyze",
        files={"prescription_file": ("huge.jpg", oversized, "image/jpeg")},
    )
    assert big_resp.status_code == 413
