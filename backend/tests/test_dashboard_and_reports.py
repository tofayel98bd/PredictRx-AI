"""Test dashboard overview metrics and clinical reporting."""

from fastapi.testclient import TestClient


def test_dashboard_overview(client: TestClient):
    response = client.get("/api/v1/dashboard/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_prescriptions_analyzed" in data
    assert "critical_interventions_count" in data
    assert "dgda_drug_catalog_count" in data
    assert data["dgda_drug_catalog_count"] >= 10


def test_clinical_report(client: TestClient):
    # Fetch a prescription number
    prescriptions_resp = client.get("/api/v1/predict-rx/prescriptions")
    assert prescriptions_resp.status_code == 200
    prescriptions = prescriptions_resp.json()
    if prescriptions:
        rx_id = prescriptions[0]["prescription_id"]
        report_resp = client.get(f"/api/v1/reports/{rx_id}")
        assert report_resp.status_code == 200
        rep_data = report_resp.json()
        assert "safety_disclaimer" in rep_data
        assert "prescription_data" in rep_data

        # Verify PDF export returns a real %PDF binary in both EN and BN
        for lang in ("en", "bn"):
            pdf_resp = client.get(f"/api/v1/reports/{rx_id}/pdf", params={"lang": lang})
            assert pdf_resp.status_code == 200
            assert pdf_resp.headers.get("content-type", "").startswith("application/pdf")
            assert pdf_resp.content[:4] == b"%PDF"


def test_reportlab_pdf_fallback_when_no_browser():
    from unittest.mock import patch
    from app.services.pdf_report_service import pdf_report_service

    sample_data = {
        "prescription_data": {
            "prescription_id": "RX-TEST-PDF",
            "patient_context": {"name": "Test Patient", "age": 60, "gender": "Male", "egfr": 28.0},
            "clinical_risk": {
                "risk_classification": "CRITICAL",
                "risk_score": 82.0,
                "calibrated_probability_note": "High AKI risk",
                "shap_features": [{"feature": "eGFR", "impact_score": 0.35, "clinical_explanation": "Low renal function"}],
            },
            "extracted_prescription": [{"brand_name": "Rolac 10", "generic_name": "Ketorolac", "dosage_syntax": "1+0+1", "timing": "After Meal", "duration_days": 14}],
            "drug_interactions": [{"drug_a": "Ketorolac", "drug_b": "Ramipril", "severity": "CRITICAL", "clinical_significance": "AKI risk", "recommended_action": "Stop NSAID"}],
            "safer_alternatives": [{"original_brand": "Rolac 10", "alternative_brand": "Napa Extend", "alternative_generic": "Paracetamol", "clinical_rationale": "Renal-sparing"}],
            "clinician_review": {"reviewed": True, "decision": "MODIFIED", "reviewer_name": "Dr. Rahman", "reviewer_license": "BMDC #123", "notes": "Switched to Napa"},
        }
    }
    with patch("app.services.pdf_report_service.find_browser_executable", return_value=None):
        pdf_path = pdf_report_service.generate_pdf(sample_data, lang="en")
        with open(pdf_path, "rb") as f:
            assert f.read(4) == b"%PDF"
