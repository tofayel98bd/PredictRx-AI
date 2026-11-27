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


def test_expanded_dgda_catalog_coverage(client: TestClient):
    """Verify that catalog contains 400+ drugs and search finds newly added BD brands."""
    response = client.get("/api/v1/drugs", params={"limit": 500})
    assert response.status_code == 200
    drugs = response.json()
    assert len(drugs) >= 400

    # Search for diabetes medication
    resp_diab = client.get("/api/v1/drugs", params={"search": "Comet"})
    assert resp_diab.status_code == 200
    assert len(resp_diab.json()) >= 1
    assert any("Metformin" in d["generic_name"] for d in resp_diab.json())

    # Search for SGLT2 inhibitor
    resp_sglt2 = client.get("/api/v1/drugs", params={"search": "Jardiance"})
    assert resp_sglt2.status_code == 200
    assert len(resp_sglt2.json()) >= 1
    assert any("Empagliflozin" in d["generic_name"] for d in resp_sglt2.json())

    # Search for DPP-4 inhibitor safe in renal failure
    resp_traj = client.get("/api/v1/drugs", params={"search": "Trajenta"})
    assert resp_traj.status_code == 200
    assert len(resp_traj.json()) >= 1
    assert "Linagliptin" in resp_traj.json()[0]["generic_name"]

    # Search for newly added high-frequency BD brands (Etorix, Pantonix, Telfast)
    for brand, expected_gen in [("Etorix", "Etoricoxib"), ("Pantonix", "Pantoprazole"), ("Telfast", "Fexofenadine")]:
        resp = client.get("/api/v1/drugs", params={"search": brand})
        assert resp.status_code == 200
        assert any(expected_gen in d["generic_name"] for d in resp.json()), f"Missing {brand}"
