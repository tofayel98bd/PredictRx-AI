"""Test DGDA drug catalog search and interaction checking."""

from fastapi.testclient import TestClient


def test_list_and_search_drugs(client: TestClient):
    response = client.get("/api/v1/drugs", params={"search": "Napa"})
    assert response.status_code == 200
    drugs = response.json()
    assert len(drugs) >= 1
    assert any("Paracetamol" in d["generic_name"] for d in drugs)


def test_list_interactions(client: TestClient):
    response = client.get("/api/v1/drug-interactions")
    assert response.status_code == 200
    interactions = response.json()
    assert len(interactions) >= 3


def test_check_direct_interaction_ketorolac_ramipril(client: TestClient):
    response = client.post(
        "/api/v1/drug-interactions/check",
        json={"drugs": ["Ketorolac Tromethamine", "Ramipril"]},
    )
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1
    assert any(r["severity"] == "CRITICAL" for r in results)
    assert any("Kidney" in r["clinical_significance"] or "AKI" in r["clinical_significance"] for r in results)


def test_triple_whammy_syndrome_detection(client: TestClient):
    response = client.post(
        "/api/v1/drug-interactions/check",
        json={"drugs": ["Ramipril", "Furosemide", "Ketorolac"]},
    )
    assert response.status_code == 200
    results = response.json()
    # Triple Whammy should be identified
    assert any("Triple Whammy" in r["mechanism"] or "Triple Whammy" in r["id"] for r in results)
