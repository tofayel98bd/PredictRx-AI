"""Test patient records and profile management."""

import uuid
from fastapi.testclient import TestClient


def test_list_patients_returns_items(client: TestClient):
    response = client.get("/api/v1/patients")
    assert response.status_code == 200
    patients = response.json()
    assert isinstance(patients, list)
    assert len(patients) >= 3
    # Check Karim record
    karim = next((p for p in patients if "Karim" in p["name"]), None)
    assert karim is not None
    assert karim["risk_level"] == "CRITICAL"  # CKD stage 4 patient


def test_get_patient_by_mrn(client: TestClient):
    response = client.get("/api/v1/patients/PRX-2026-0001")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Mohammad Abdul Karim"
    assert data["egfr"] < 30.0


def test_create_patient(client: TestClient):
    unique_mrn = f"PRX-TEST-{uuid.uuid4().hex[:6].upper()}"
    response = client.post(
        "/api/v1/patients",
        json={
            "mrn": unique_mrn,
            "full_name": "Test Patient Name",
            "age": 42,
            "gender": "male",
            "phone": "+8801700123456",
            "clinical_profile": {
                "egfr": 75.0,
                "serum_creatinine": 1.1,
                "chronic_conditions": ["Hypertension"],
                "known_allergies": [],
            },
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["mrn"] == unique_mrn
    assert data["full_name"] == "Test Patient Name"
