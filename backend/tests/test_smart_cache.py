"""Unit and integration tests for PredictRx Smart Offline Cache layer."""

import hashlib
import pytest
from fastapi.testclient import TestClient

from app.cache.smart_cache import (
    smart_cache,
    GOLDEN_SCENARIO_1_CKD_KETOROLAC,
    GOLDEN_SCENARIO_2_TRIPLE_WHAMMY,
    GOLDEN_SCENARIO_3_PEDIATRIC_ASPIRIN,
)
from app.main import app
from app.schemas.analysis import PrescriptionAnalysisResult


@pytest.fixture
def client():
    return TestClient(app)


def test_golden_scenarios_preseeded():
    """Verify that all 3 Hackathon Golden Scenarios are pre-loaded in cache."""
    s1 = smart_cache.get_scenario("GOLDEN_01_CKD_KETOROLAC")
    s2 = smart_cache.get_scenario("GOLDEN_02_TRIPLE_WHAMMY")
    s3 = smart_cache.get_scenario("GOLDEN_03_PEDIATRIC_ASPIRIN")

    assert s1 is not None
    assert s1["name"] == "Mohammad Abdul Karim"
    assert s1["risk"]["risk_score"] == 86.0

    assert s2 is not None
    assert s2["name"] == "Begum Rokeya Sultana"
    assert s2["risk"]["risk_score"] == 78.0

    assert s3 is not None
    assert s3["name"] == "Master Ayan"
    assert s3["risk"]["risk_score"] == 84.0


def test_match_by_binary_hash():
    """Verify instant binary hash matching for frontend demo sample blob."""
    demo_blob = b"sample-prescription-image-bytes"
    matched = smart_cache.match_scenario(file_bytes=demo_blob)
    assert matched is not None
    assert matched["scenario_id"] == "GOLDEN_01_CKD_KETOROLAC"


def test_match_by_filename_heuristic():
    """Verify filename heuristic matching."""
    matched_ckd = smart_cache.match_scenario(file_name="patient_rx_rolac_14days.jpg")
    assert matched_ckd is not None
    assert matched_ckd["scenario_id"] == "GOLDEN_01_CKD_KETOROLAC"

    matched_triple = smart_cache.match_scenario(file_name="triple_whammy_case.png")
    assert matched_triple is not None
    assert matched_triple["scenario_id"] == "GOLDEN_02_TRIPLE_WHAMMY"

    matched_ped = smart_cache.match_scenario(file_name="pediatric_fever_aspirin.jpeg")
    assert matched_ped is not None
    assert matched_ped["scenario_id"] == "GOLDEN_03_PEDIATRIC_ASPIRIN"


def test_match_by_patient_context():
    """Verify heuristic matching based on clinical profile."""
    # Karim CKD Stage 3
    matched_karim = smart_cache.match_scenario(
        patient_context={
            "name": "Abdul Karim",
            "age": 62,
            "conditions": ["CKD Stage 3a"],
            "egfr": 34.5,
        }
    )
    assert matched_karim is not None
    assert matched_karim["scenario_id"] == "GOLDEN_01_CKD_KETOROLAC"

    # Master Ayan Pediatric
    matched_ayan = smart_cache.match_scenario(
        patient_context={
            "name": "Master Ayan",
            "age": 8,
            "conditions": ["Fever"],
        }
    )
    assert matched_ayan is not None
    assert matched_ayan["scenario_id"] == "GOLDEN_03_PEDIATRIC_ASPIRIN"


def test_to_analysis_result_schema_validity():
    """Verify that cached scenarios convert to fully valid Pydantic PrescriptionAnalysisResult."""
    res = smart_cache.to_analysis_result(GOLDEN_SCENARIO_1_CKD_KETOROLAC)
    assert isinstance(res, PrescriptionAnalysisResult)
    assert res.meta.latency_ms == 14
    assert res.meta.ocr_engine == "PredictRx Smart Offline Cache (Fail-Safe)"
    assert res.clinical_risk.risk_score == 86.0
    assert len(res.clinical_risk.shap_features) >= 3
    assert len(res.extracted_prescription) == 2
    assert len(res.safer_alternatives) >= 1
    assert "Napa Extend" in res.safer_alternatives[0].alternative_brand
    assert res.bangla_companion is not None
    assert "৮৬% কিডনি ফেইলিউর ঝুঁকি" in res.bangla_companion.critical_safety_notice_bengali


def test_cache_stats_tracking():
    """Verify stats tracking in cache."""
    stats = smart_cache.get_stats()
    assert stats["golden_scenarios_preseeded"] == 3
    assert stats["cache_hits"] >= 1
    assert "hit_ratio_pct" in stats


def test_api_cache_endpoints(client):
    """Test REST API cache endpoints."""
    # 1. Cache status endpoint
    resp = client.get("/api/v1/predict-rx/cache/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "cache_hits" in data
    assert data["golden_scenarios_preseeded"] == 3

    # 2. Scenarios list endpoint
    resp = client.get("/api/v1/predict-rx/scenarios")
    assert resp.status_code == 200
    scenarios = resp.json()
    assert len(scenarios) == 3
    assert scenarios[0]["scenario_id"] == "GOLDEN_01_CKD_KETOROLAC"

    # 3. Direct Scenario Run endpoint (< 15ms)
    resp = client.get("/api/v1/predict-rx/scenarios/GOLDEN_01_CKD_KETOROLAC")
    assert resp.status_code == 200
    result = resp.json()
    assert result["clinical_risk"]["risk_score"] == 86.0
    assert result["meta"]["latency_ms"] == 14

    # 4. Analyze endpoint Fast-Path via synthetic blob
    resp = client.post(
        "/api/v1/predict-rx/analyze",
        files={"prescription_file": ("demo_prescription.png", b"sample-prescription-image-bytes", "image/png")},
    )
    assert resp.status_code == 200
    analysis = resp.json()
    assert analysis["meta"]["ocr_engine"] == "PredictRx Smart Offline Cache (Fail-Safe)"
    assert analysis["clinical_risk"]["risk_score"] == 86.0
