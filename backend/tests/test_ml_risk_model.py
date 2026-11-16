"""Unit and integration tests for XGBoost clinical risk model and SHAP explainability."""

from app.ml.risk_predictor import ClinicalRiskPredictor
from app.schemas.analysis import (
    DrugInteractionSchema,
    PatientContextSchema,
    ValidatedMedicineSchema,
)
from app.services.clinical_risk_service import ClinicalRiskService


def test_xgboost_model_loads_and_predicts_ckd_ketorolac():
    predictor = ClinicalRiskPredictor()
    assert predictor.model is not None, "XGBoost model failed to load"
    assert predictor.explainer is not None, "SHAP TreeExplainer failed to load"

    patient = PatientContextSchema(
        name="Mohammad Abdul Karim",
        age=62,
        gender="Male",
        creatinine=2.1,
        egfr=34.5,
        hba1c=8.4,
        systolic_bp=150,
        diastolic_bp=92,
        conditions=["Type 2 Diabetes", "Hypertension", "CKD Stage 3"],
        current_medications=["Metformin 500mg"],
    )

    medications = [
        ValidatedMedicineSchema(
            brand_name="Bizoran 5/20",
            generic_name="Amlodipine + Olmesartan",
            dosage_syntax="1+0+0",
            duration_days=30,
            syntax_valid=True,
            confidence=0.96,
        ),
        ValidatedMedicineSchema(
            brand_name="Rolac 10",
            generic_name="Ketorolac Tromethamine",
            dosage_syntax="1+0+1",
            duration_days=14,
            syntax_valid=False,
            confidence=0.94,
        ),
    ]

    interactions = [
        DrugInteractionSchema(
            id="COLLISION-01",
            drug_a="Ketorolac",
            drug_b="Olmesartan",
            severity="CRITICAL",
            clinical_significance="Severe nephrotoxic collision inducing AKI",
            evidence_source="KDIGO 2024",
            recommended_action="Avoid NSAID with ARB in CKD",
        )
    ]

    res = predictor.predict(patient, medications, interactions)

    # Risk assertion: Should predict acute high/critical risk (>75%)
    assert res.risk_score >= 75.0
    assert res.risk_classification == "CRITICAL"
    assert res.aki_risk_percentage is not None and res.aki_risk_percentage >= 70.0

    # SHAP features assertion
    assert len(res.shap_features) >= 2
    top_feature_names = [s.feature for s in res.shap_features]
    assert any("Ketorolac Duration" in f or "Duration" in f for f in top_feature_names)
    assert any("eGFR" in f or "Renal" in f or "Collision" in f for f in top_feature_names)


def test_xgboost_low_risk_healthy_patient():
    predictor = ClinicalRiskPredictor()

    patient = PatientContextSchema(
        name="Tanvir Ahmed",
        age=28,
        gender="Male",
        creatinine=0.8,
        egfr=110.0,
        conditions=[],
    )

    medications = [
        ValidatedMedicineSchema(
            brand_name="Napa 500mg",
            generic_name="Paracetamol",
            dosage_syntax="1+0+1",
            duration_days=3,
            syntax_valid=True,
            confidence=0.98,
        )
    ]

    res = predictor.predict(patient, medications, [])

    # Risk assertion: healthy young patient taking simple paracetamol
    assert res.risk_score < 30.0
    assert res.risk_classification == "LOW"


def test_clinical_risk_service_with_safer_alternatives():
    service = ClinicalRiskService()

    patient = PatientContextSchema(
        name="Mohammad Abdul Karim",
        age=62,
        gender="Male",
        creatinine=2.1,
        egfr=34.5,
        conditions=["CKD Stage 3"],
    )

    medications = [
        ValidatedMedicineSchema(
            brand_name="Rolac 10",
            generic_name="Ketorolac Tromethamine",
            dosage_syntax="1+0+1",
            duration_days=14,
            syntax_valid=False,
            confidence=0.94,
        )
    ]

    analysis, alternatives = service.evaluate_risk(patient, medications, [])

    assert analysis.risk_score >= 70.0
    assert len(alternatives) >= 1
    assert alternatives[0].alternative_brand == "Napa Extend 665mg"
    assert alternatives[0].alternative_generic == "Paracetamol"
