"""Tests for Milestone 3: Automated Clinical Safety Guardrails across 5 safety domains."""

from fastapi.testclient import TestClient


def test_penicillin_allergy_and_cephalosporin_cross_reactivity(client: TestClient):
    payload = {
        "patient_context": {
            "name": "Allergy Test Patient",
            "age": 34,
            "gender": "Female",
            "allergies": ["Penicillin"],
            "conditions": ["Acute Pharyngitis"],
        },
        "medications": [
            {"brand_name": "Fimoxyl 500", "dosage_syntax": "1+1+1", "duration_raw": "7 days"},
            {"brand_name": "Cefim 200", "dosage_syntax": "1+0+1", "duration_raw": "7 days"},
        ],
    }
    resp = client.post("/api/v1/predict-rx/analyze", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["clinical_risk"]["risk_classification"] == "CRITICAL"
    assert body["clinical_risk"]["risk_score"] >= 78.0
    codes = {a["code"] for a in body["prescription_level_alerts"]}
    assert "ALLERGY_PENICILLIN_DIRECT" in codes
    assert "ALLERGY_BETA_LACTAM_CROSS_REACTIVITY" in codes
    assert any("Azithromycin" in a["alternative_generic"] for a in body["safer_alternatives"])


def test_ckd_stage4_metformin_and_etoricoxib_triple_whammy(client: TestClient):
    payload = {
        "patient_context": {
            "name": "CKD4 Guardrail Patient",
            "age": 64,
            "gender": "Male",
            "egfr": 24.0,
            "creatinine": 2.8,
            "conditions": ["CKD Stage 4", "Type 2 Diabetes"],
        },
        "medications": [
            {"brand_name": "Comet 500", "dosage_syntax": "1+0+1", "duration_raw": "30 days"},
            {"brand_name": "Etorix 90", "dosage_syntax": "1+0+0", "duration_raw": "7 days"},
            {"brand_name": "Ramiril 5", "dosage_syntax": "1+0+0", "duration_raw": "30 days"},
            {"brand_name": "Lasix 40", "dosage_syntax": "1+0+0", "duration_raw": "14 days"},
        ],
    }
    resp = client.post("/api/v1/predict-rx/analyze", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    codes = {a["code"] for a in body["prescription_level_alerts"]}
    assert "RENAL_METFORMIN_CONTRAINDICATION" in codes
    assert "RENAL_NSAID_AKI_CONTRAINDICATION" in codes
    assert any("Triple Whammy" in i["mechanism"] or "Triple Whammy" in i["id"] for i in body["drug_interactions"])
    assert any("Linagliptin" in a["alternative_generic"] for a in body["safer_alternatives"])


def test_pregnancy_teratogen_and_hepatic_guardrails(client: TestClient):
    # Pregnancy + Olmesartan (Bizoran)
    preg_payload = {
        "patient_context": {
            "name": "Gestational HTN Patient",
            "age": 29,
            "gender": "Female",
            "pregnancy": True,
            "conditions": ["Gestational Hypertension"],
        },
        "medications": [
            {"brand_name": "Bizoran 5/20", "dosage_syntax": "1+0+0", "duration_raw": "30 days"},
        ],
    }
    preg_resp = client.post("/api/v1/predict-rx/analyze", json=preg_payload)
    assert preg_resp.status_code == 200
    preg_body = preg_resp.json()
    assert preg_body["clinical_risk"]["risk_classification"] == "CRITICAL"
    assert any(a["code"] == "PREGNANCY_TERATOGEN_CONTRAINDICATION" for a in preg_body["prescription_level_alerts"])
    assert any("Methyldopa" in a["alternative_generic"] for a in preg_body["safer_alternatives"])

    # Hepatic cirrhosis + Atorvastatin
    hep_payload = {
        "patient_context": {
            "name": "Cirrhosis Patient",
            "age": 55,
            "gender": "Male",
            "conditions": ["Decompensated Liver Cirrhosis"],
        },
        "medications": [
            {"brand_name": "Atorva 20", "dosage_syntax": "0+0+1", "duration_raw": "30 days"},
        ],
    }
    hep_resp = client.post("/api/v1/predict-rx/analyze", json=hep_payload)
    assert hep_resp.status_code == 200
    hep_body = hep_resp.json()
    assert hep_body["clinical_risk"]["risk_classification"] == "CRITICAL"
    assert any(a["code"] == "HEPATIC_STATIN_CONTRAINDICATION" for a in hep_body["prescription_level_alerts"])


def test_pediatric_weight_paracetamol_overdose_and_clopidogrel_ppi(client: TestClient):
    # 15 kg child prescribed 500mg Paracetamol 1+1+1 = 1500mg/day (> 60*15=900mg/day)
    ped_payload = {
        "patient_context": {
            "name": "Child Weight Check",
            "age": 6,
            "gender": "Male",
            "weight_kg": 15.0,
            "conditions": ["High Fever"],
        },
        "medications": [
            {"brand_name": "Napa", "strength": "500 mg", "dosage_syntax": "1+1+1", "duration_raw": "5 days"},
        ],
    }
    ped_resp = client.post("/api/v1/predict-rx/analyze", json=ped_payload)
    assert ped_resp.status_code == 200
    ped_body = ped_resp.json()
    assert any(a["code"] == "PEDIATRIC_WEIGHT_OVERDOSE" for a in ped_body["prescription_level_alerts"])
    assert ped_body["clinical_risk"]["risk_score"] >= 78.0

    # Clopidogrel + Esomeprazole -> Pantoprazole safer alternative
    ppi_payload = {
        "patient_context": {"name": "Post-PCI Patient", "age": 58, "gender": "Male", "conditions": ["CAD"]},
        "medications": [
            {"brand_name": "Deplatt 75", "dosage_syntax": "1+0+0", "duration_raw": "30 days"},
            {"brand_name": "Sergel 20", "dosage_syntax": "1+0+0", "duration_raw": "30 days"},
        ],
    }
    ppi_resp = client.post("/api/v1/predict-rx/analyze", json=ppi_payload)
    assert ppi_resp.status_code == 200
    ppi_body = ppi_resp.json()
    assert any("Pantoprazole" in a["alternative_generic"] for a in ppi_body["safer_alternatives"])
