"""Test CDSS prescription analysis orchestration and clinician review workflow."""

import json
from fastapi.testclient import TestClient


def test_analyze_critical_ketorolac_prescription(client: TestClient):
    payload = {
        "patient_context": {
            "name": "Mohammad Abdul Karim",
            "age": 68,
            "gender": "Male",
            "creatinine": 2.4,
            "egfr": 28.5,
            "conditions": ["CKD Stage 4", "Hypertension", "Type 2 Diabetes"],
            "current_medications": ["Ramipril 5mg OD"],
            "allergies": ["Penicillin"],
        },
        "medications": [
            {
                "brand_name": "Rolac 10mg",
                "generic_name": "Ketorolac Tromethamine",
                "dosage_syntax": "1+0+1",
                "duration_raw": "14 days",
                "timing": "After Meal",
            },
            {
                "brand_name": "Sergel 20",
                "generic_name": "Esomeprazole",
                "dosage_syntax": "1+0+0",
                "duration_raw": "14 days",
                "timing": "Before Meal",
            },
        ],
    }

    response = client.post("/api/v1/predict-rx/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Core response assertions
    assert data["status"] == "COMPLETED"
    assert "analysis_id" in data
    assert "prescription_id" in data

    # Risk assertion: Ketorolac + eGFR < 30 + duration 14 days + ACEi interaction
    assert data["clinical_risk"]["risk_score"] >= 70
    assert data["clinical_risk"]["risk_classification"] == "CRITICAL"

    # SHAP explanations
    shap = data["clinical_risk"]["shap_features"]
    assert len(shap) >= 2
    assert any(s["category"] == "Renal" for s in shap)
    assert any(s["category"] == "Duration" for s in shap)

    # Safer alternatives
    alternatives = data["safer_alternatives"]
    assert len(alternatives) >= 1
    assert any("Paracetamol" in a["alternative_generic"] for a in alternatives)

    # Bangla companion
    bangla = data["bangla_companion"]
    assert len(bangla["medicines"]) >= 2
    assert "জরুরি সতর্কতা" in bangla["critical_safety_notice_bengali"]

    # Clinician review workflow test
    rx_id = data["prescription_id"]
    review_resp = client.post(
        f"/api/v1/predict-rx/prescriptions/{rx_id}/review",
        json={
            "reviewer_name": "Dr. Rafiqul Islam",
            "reviewer_license": "BMDC #A-45892",
            "decision": "MODIFIED",
            "notes": "Discontinued Ketorolac immediately due to CKD stage 4. Substituted with Paracetamol 665mg PRN.",
        },
    )
    assert review_resp.status_code == 200
    rev_data = review_resp.json()
    assert rev_data["clinician_review"]["reviewed"] is True
    assert rev_data["clinician_review"]["decision"] == "MODIFIED"


def test_analyze_multipart_file_upload(client: TestClient):
    patient_context = {
        "name": "Begum Rokeya Sultana",
        "age": 54,
        "gender": "Female",
        "egfr": 86.0,
        "conditions": ["Hypertension"],
        "current_medications": [],
    }

    file_content = b"Simulated prescription image data bytes"
    files = {"prescription_file": ("prescription_sample.png", file_content, "image/png")}
    data = {"patient_context": json.dumps(patient_context)}

    response = client.post("/api/v1/predict-rx/analyze", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "COMPLETED"
    assert res["patient_context"]["name"] == "Begum Rokeya Sultana"
    assert len(res["extracted_prescription"]) >= 1
