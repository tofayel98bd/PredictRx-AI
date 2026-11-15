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
