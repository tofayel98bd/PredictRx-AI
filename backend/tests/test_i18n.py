"""Automated test suite for PredictRx-AI Internationalization (i18n) System."""

import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.i18n.translator import translator, t
from app.services.pdf_report_service import pdf_report_service


def test_translator_direct_lookups():
    """Verify dictionary lookups, fallback behavior, and token interpolation."""
    # Direct lookups
    assert t("auth.invalid_credentials", lang="en") == "Invalid email or password."
    assert t("auth.invalid_credentials", lang="bn") == "ভুল ইমেল বা পাসওয়ার্ড।"

    # Parameter interpolation
    en_msg = t("reports.report_not_found", lang="en", prescription_id="RX-999")
    assert en_msg == "Report for prescription 'RX-999' not found."

    bn_msg = t("reports.report_not_found", lang="bn", prescription_id="RX-999")
    assert bn_msg == "'RX-999' প্রেসক্রিপশনটির রিপোর্ট পাওয়া যায়নি।"

    # Fallback for unsupported language defaults to English
    fallback_msg = t("auth.invalid_credentials", lang="fr")
    assert fallback_msg == "Invalid email or password."

    # Unknown key returns the key itself
    assert t("non_existent.key", lang="bn") == "non_existent.key"


def test_language_negotiation_header_and_query(client: TestClient):
    """Verify Accept-Language and query parameters translate error messages."""
    # 1. English default without headers
    res_en = client.post(
        "/api/v1/auth/login",
        json={"email": "doctor@predictrx.bd", "password": "BadPassword123!"},
    )
    assert res_en.status_code == 401
    assert "Invalid email or password" in res_en.json()["detail"]

    # 2. Bangla via Accept-Language header
    res_bn = client.post(
        "/api/v1/auth/login",
        json={"email": "doctor@predictrx.bd", "password": "BadPassword123!"},
        headers={"Accept-Language": "bn-BD,bn;q=0.9,en;q=0.8"},
    )
    assert res_bn.status_code == 401
    assert "ভুল ইমেল বা পাসওয়ার্ড" in res_bn.json()["detail"]

    # 3. Bangla via explicit query param override
    res_query = client.post(
        "/api/v1/auth/login?lang=bn",
        json={"email": "doctor@predictrx.bd", "password": "BadPassword123!"},
    )
    assert res_query.status_code == 401
    assert "ভুল ইমেল বা পাসওয়ার্ড" in res_query.json()["detail"]

    # 4. Bangla via X-Language header
    res_xlang = client.post(
        "/api/v1/auth/login",
        json={"email": "doctor@predictrx.bd", "password": "BadPassword123!"},
        headers={"X-Language": "bn"},
    )
    assert res_xlang.status_code == 401
    assert "ভুল ইমেল বা পাসওয়ার্ড" in res_xlang.json()["detail"]


def test_update_user_language_preferences(client: TestClient, auth_headers: dict):
    """Verify PATCH /api/v1/auth/me/preferences updates user language in database."""
    # Check default preference
    res_me = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res_me.status_code == 200
    assert res_me.json()["preferred_language"] in ("en", "bn")

    # Update preference to Bangla
    res_patch = client.patch(
        "/api/v1/auth/me/preferences",
        headers=auth_headers,
        json={"preferred_language": "bn"},
    )
    assert res_patch.status_code == 200
    data = res_patch.json()
    assert data["preferred_language"] == "bn"

    # Verify persistence via GET /me
    res_verify = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res_verify.status_code == 200
    assert res_verify.json()["preferred_language"] == "bn"

    # Reset preference back to English
    res_reset = client.patch(
        "/api/v1/auth/me/preferences",
        headers=auth_headers,
        json={"preferred_language": "en"},
    )
    assert res_reset.status_code == 200
    assert res_reset.json()["preferred_language"] == "en"

    # Attempt to update with invalid language code
    res_invalid = client.patch(
        "/api/v1/auth/me/preferences",
        headers=auth_headers,
        json={"preferred_language": "de"},
    )
    assert res_invalid.status_code == 422


def test_localized_report_endpoint(client: TestClient):
    """Verify reports endpoint honors language parameters."""
    # Test 404 in Bangla
    res_bn = client.get("/api/v1/reports/UNKNOWN_RX_001", headers={"Accept-Language": "bn"})
    assert res_bn.status_code == 404
    assert "প্রেসক্রিপশনটির রিপোর্ট পাওয়া যায়নি" in res_bn.json()["detail"]

    # Test 404 in English
    res_en = client.get("/api/v1/reports/UNKNOWN_RX_001", headers={"Accept-Language": "en"})
    assert res_en.status_code == 404
    assert "Report for prescription" in res_en.json()["detail"]


def test_bilingual_pdf_report_rendering(tmp_path: Path):
    """Verify that both English and Bangla HTML & PDF reports generate with valid content."""
    dummy_report = {
        "report_id": "REP-RX-TEST-001",
        "prescription_data": {
            "prescription_id": "RX-TEST-001",
            "analysis_id": "AN-TEST-001",
            "timestamp": "2026-11-17T10:00:00",
            "patient_context": {
                "name": "Mohammad Abdul Karim",
                "age": 68,
                "gender": "Male",
                "creatinine": 2.4,
                "egfr": 28.5,
                "systolic_bp": 145,
                "diastolic_bp": 90,
                "conditions": ["CKD Stage 4", "Hypertension"],
            },
            "clinical_risk": {
                "risk_score": 82.5,
                "risk_classification": "CRITICAL",
                "aki_risk_percentage": 82.5,
                "gi_bleed_risk_percentage": 68.0,
                "cardiovascular_risk_percentage": 30.0,
                "shap_features": [
                    {
                        "feature": "Ketorolac Duration (14 Days)",
                        "value": "14 days",
                        "impact_score": 0.45,
                        "clinical_explanation": "Exceeding the 5-day ceiling sharply increases renal toxicity risk.",
                    }
                ],
            },
            "drug_interactions": [
                {
                    "drug_a": "Ketorolac",
                    "drug_b": "Ramipril",
                    "severity": "CRITICAL",
                    "clinical_implication": "Blunts renal prostaglandins and causes acute kidney injury.",
                    "management_protocol": "Discontinue ketorolac and substitute with paracetamol.",
                }
            ],
            "extracted_prescription": [
                {
                    "brand_name": "Rolac 10mg",
                    "generic_name": "Ketorolac Tromethamine",
                    "form": "Tablet",
                    "strength": "10 mg",
                    "dosage_syntax": "1+0+1",
                    "duration_days": 14,
                    "timing": "After Meal",
                }
            ],
        },
    }

    # 1. HTML generation for English
    html_en = pdf_report_service.generate_html(dummy_report, lang="en")
    assert "CDSS Clinical Audit & Decision Report" in html_en
    assert "Ketorolac Tromethamine" in html_en
    assert "CRITICAL RISK" in html_en

    # 2. HTML generation for Bangla
    html_bn = pdf_report_service.generate_html(dummy_report, lang="bn")
    assert "ক্লিনিক্যাল অডিট ও প্রেসক্রিপশন সিদ্ধান্ত রিপোর্ট" in html_bn
    assert "প্রেসক্রিপশনে নির্দেশিত ওষুধসমূহ" in html_bn
    assert "Ketorolac Tromethamine" in html_bn  # Generic name preserved in English

    # 3. PDF generation in English and Bangla
    pdf_en = tmp_path / "test_report_en.pdf"
    res_pdf_en = pdf_report_service.generate_pdf(dummy_report, output_path=str(pdf_en), lang="en")
    assert os.path.exists(res_pdf_en)
    assert os.path.getsize(res_pdf_en) > 0

    pdf_bn = tmp_path / "test_report_bn.pdf"
    res_pdf_bn = pdf_report_service.generate_pdf(dummy_report, output_path=str(pdf_bn), lang="bn")
    assert os.path.exists(res_pdf_bn)
    assert os.path.getsize(res_pdf_bn) > 0
