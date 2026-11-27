"""Clinical risk evaluation, real XGBoost + SHAP factor breakdown, and safer alternatives service."""

from typing import TYPE_CHECKING, List, Optional, Tuple

from app.ml.risk_predictor import ClinicalRiskPredictor
from app.schemas.analysis import (
    ClinicalRiskAnalysisSchema,
    EvidenceCitationSchema,
    PatientContextSchema,
    SaferAlternativeSchema,
    ShapContributionSchema,
    ValidatedMedicineSchema,
    DrugInteractionSchema,
)

if TYPE_CHECKING:
    from app.services.clinical_guardrail_service import GuardrailReport


class ClinicalRiskService:
    """Evaluates multi-factor clinical risk scores, real XGBoost + SHAP explanations, and safer alternatives."""

    def __init__(self):
        self.predictor = ClinicalRiskPredictor()

    def evaluate_risk(
        self,
        patient: PatientContextSchema,
        medications: List[ValidatedMedicineSchema],
        interactions: List[DrugInteractionSchema],
        guardrail_report: Optional["GuardrailReport"] = None,
    ) -> Tuple[ClinicalRiskAnalysisSchema, List[SaferAlternativeSchema]]:
        if not medications:
            return ClinicalRiskAnalysisSchema(
                risk_score=0.0,
                risk_classification="LOW",
                calibrated_probability_note="No medications detected or extracted from the uploaded prescription.",
                is_synthetic_demo=False,
                aki_risk_percentage=0.0,
                gi_bleed_risk_percentage=0.0,
                cardiovascular_risk_percentage=0.0,
                shap_features=[],
                patient_specific_factors=[],
                evidence_citations=[],
                limitations=["No medications extracted or supplied."],
            ), []

        # 1. Real Machine Learning + SHAP Prediction
        risk_analysis = self.predictor.predict(patient, medications, interactions)

        # 2. Evidence Citations
        citations = [
            EvidenceCitationSchema(
                source="KDIGO 2024 Practice Guideline",
                title="Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease",
                year=2024,
                url="https://kdigo.org/guidelines/ckd-evaluation-and-management/",
            ),
            EvidenceCitationSchema(
                source="CMAJ 2013 Cohort Study",
                title="Triple Whammy: ACEi/ARB + Diuretic + NSAID and acute kidney injury risk",
                year=2013,
                url="https://www.cmaj.ca/content/185/4/E179",
            ),
            EvidenceCitationSchema(
                source="FDA / DGDA Pharmacovigilance Advisory",
                title="Ketorolac Tromethamine - Black Box Warning on 5-Day Maximum Course",
                year=2023,
                url="https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/019645s019lbl.pdf",
            ),
            EvidenceCitationSchema(
                source="AGS Beers Criteria 2023",
                title="American Geriatrics Society Updated Beers Criteria for Potentially Inappropriate Medication Use",
                year=2023,
                url="https://agsjournals.onlinelibrary.wiley.com/doi/10.1111/jgs.18372",
            ),
        ]
        risk_analysis.evidence_citations = citations
        risk_analysis.limitations = [
            "Risk estimates generated via pre-trained XGBoost regression model with SHAP tree attribution.",
            "Decision support output is advisory; attending clinician must confirm all therapeutic alterations.",
        ]

        # 3. Patient Specific Factors summary
        factors = []
        if patient.age >= 65:
            factors.append(f"Geriatric age vulnerability ({patient.age} years)")
        if patient.egfr is not None and patient.egfr < 60:
            factors.append(f"Impaired renal function (eGFR {patient.egfr} mL/min)")
        elif patient.creatinine is not None and patient.creatinine > 1.4:
            factors.append(f"Elevated serum creatinine ({patient.creatinine} mg/dL)")
        for condition in patient.conditions:
            factors.append(f"Co-existing condition: {condition}")
        if guardrail_report and guardrail_report.clinical_factors:
            for gf in guardrail_report.clinical_factors:
                if gf not in factors:
                    factors.append(gf)
        risk_analysis.patient_specific_factors = factors

        # Calibrate risk floor & SHAP if deterministic critical/warning guardrails triggered
        if guardrail_report:
            if guardrail_report.critical_count > 0:
                if risk_analysis.risk_score < 78.0:
                    risk_analysis.risk_score = 78.0
                    risk_analysis.risk_classification = "CRITICAL"
                    risk_analysis.calibrated_probability_note = (
                        f"Critical deterministic clinical contraindication triggered: {guardrail_report.top_critical_reason}"
                    )
                if guardrail_report.top_critical_reason:
                    risk_analysis.shap_features.insert(
                        0,
                        ShapContributionSchema(
                            feature="Deterministic Contraindication Guardrail",
                            value="CRITICAL",
                            impact_score=0.42,
                            category="Patient Condition",
                            clinical_explanation=guardrail_report.top_critical_reason,
                        ),
                    )
            elif guardrail_report.warning_count > 0 and risk_analysis.risk_score < 42.0:
                risk_analysis.risk_score = 42.0
                risk_analysis.risk_classification = "MODERATE"

        # 4. Safer Alternatives Generator
        safer_alternatives: List[SaferAlternativeSchema] = []
        seen_alt_generics = set()

        def _append_alt(alt: SaferAlternativeSchema) -> None:
            key = alt.original_generic.lower()
            if key not in seen_alt_generics:
                seen_alt_generics.add(key)
                safer_alternatives.append(alt)

        # Rule A: Ketorolac in renal impairment or duration > 5 days -> Paracetamol (Napa Extend)
        for med in medications:
            if med.generic_name and "ketorolac" in med.generic_name.lower():
                _append_alt(
                    SaferAlternativeSchema(
                        original_brand=med.brand_name,
                        original_generic="Ketorolac Tromethamine",
                        alternative_brand="Napa Extend 665mg",
                        alternative_generic="Paracetamol",
                        clinical_rationale="Ketorolac is contraindicated in renal impairment and duration >5 days due to severe AKI and GI bleed risks. Modified-release paracetamol offers effective analgesia without inhibiting renal prostaglandins.",
                        safety_benefit="Renal-sparing; does not inhibit renal prostaglandin synthesis or provoke gastrointestinal hemorrhage.",
                        precautions="Ensure total daily paracetamol dose does not exceed 3-4 g/day from all sources.",
                        requires_clinician_approval=True,
                    )
                )

        # Rule B: Pediatric Aspirin exposure -> Paracetamol Suspension
        if patient.age < 16:
            for med in medications:
                if med.generic_name and "aspirin" in med.generic_name.lower():
                    _append_alt(
                        SaferAlternativeSchema(
                            original_brand=med.brand_name,
                            original_generic="Aspirin",
                            alternative_brand="Napa Suspension 120mg/5ml",
                            alternative_generic="Paracetamol",
                            clinical_rationale="Aspirin is strictly contraindicated in pediatric patients with viral symptoms due to fatal risk of Reye's syndrome (hepatic and cerebral failure).",
                            safety_benefit="Proven pediatric antipyretic safety profile without Reye's syndrome risk.",
                            precautions="Dose accurately according to pediatric body weight (10-15 mg/kg every 4-6 hours).",
                            requires_clinician_approval=True,
                        )
                    )

        # Rule C: Triple Whammy collision -> Substitute Systemic NSAID
        has_triple_whammy = any("triple whammy" in i.clinical_significance.lower() for i in interactions)
        if has_triple_whammy and not safer_alternatives:
            for med in medications:
                if med.generic_name and any(n in med.generic_name.lower() for n in ["diclofenac", "naproxen", "ibuprofen", "aceclofenac", "etoricoxib"]):
                    _append_alt(
                        SaferAlternativeSchema(
                            original_brand=med.brand_name,
                            original_generic=med.generic_name,
                            alternative_brand="Napa 500mg / Topical Gel",
                            alternative_generic="Paracetamol / Topical NSAID",
                            clinical_rationale="Simultaneous ACEi/ARB + Diuretic + NSAID (Triple Whammy) destroys renal autoregulation. Discontinuing systemic NSAID eliminates afferent vasoconstriction.",
                            safety_benefit="Preserves renal plasma flow and prevents acute dialysis requirement.",
                            precautions="Monitor blood pressure and renal function within 72 hours.",
                            requires_clinician_approval=True,
                        )
                    )

        # Rule D: ACEi/ARB + Potassium collision -> Discontinue Potassium Supplement
        has_k_collision = any("hyperkalemia" in i.clinical_significance.lower() or "potassium" in i.clinical_significance.lower() for i in interactions)
        if has_k_collision:
            _append_alt(
                SaferAlternativeSchema(
                    original_brand="Potassium Supplement",
                    original_generic="Potassium Chloride",
                    alternative_brand="Dietary Moderation & Hydration",
                    alternative_generic="Electrolyte Monitoring",
                    clinical_rationale="Concomitant ACE inhibitor / ARB therapy diminishes renal potassium clearance. Stopping supplemental potassium prevents hyperkalemic cardiac arrest.",
                    safety_benefit="Eliminates lethal ventricular arrhythmia hazard while sustaining antihypertensive efficacy.",
                    precautions="Check baseline serum potassium and repeat in 7 days.",
                    requires_clinician_approval=True,
                )
            )

        # Rule E: Clopidogrel + Omeprazole/Esomeprazole -> Pantoprazole (Pantonix 20/40)
        has_clopid_ppi = any("cyp2c19" in (i.mechanism or "").lower() for i in interactions)
        if has_clopid_ppi:
            for med in medications:
                if med.generic_name and any(p in med.generic_name.lower() for p in ("omeprazole", "esomeprazole")):
                    _append_alt(
                        SaferAlternativeSchema(
                            original_brand=med.brand_name,
                            original_generic=med.generic_name,
                            alternative_brand="Pantonix 20mg / Trupan 20mg",
                            alternative_generic="Pantoprazole",
                            clinical_rationale="Omeprazole/Esomeprazole inhibit CYP2C19 bioactivation of Clopidogrel. Pantoprazole preserves full antiplatelet efficacy.",
                            safety_benefit="Prevents stent thrombosis and recurrent ischemic events.",
                            precautions="Take once daily 30 minutes before breakfast.",
                            requires_clinician_approval=True,
                        )
                    )

        # Merge guardrail safer alternatives (Allergy, Renal Metformin/NSAID, Pregnancy)
        if guardrail_report:
            for alt in guardrail_report.safer_alternatives:
                _append_alt(alt)

        return risk_analysis, safer_alternatives
