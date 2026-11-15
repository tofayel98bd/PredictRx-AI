"""Prescription analysis schemas matching the frontend contract."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class IssueSchema(BaseModel):
    code: str
    severity: str  # CRITICAL, WARNING, INFO
    message: str


class ValidatedMedicineSchema(BaseModel):
    brand_name: str
    generic_name: Optional[str] = None
    form: Optional[str] = None
    strength: Optional[str] = None
    dosage_syntax: Optional[str] = None  # e.g., "1+0+1"
    frequency_per_day: Optional[float] = None
    timing: Optional[str] = None
    duration_days: Optional[int] = None
    syntax_valid: bool = True
    syntax_note: str = ""
    issues: List[IssueSchema] = Field(default_factory=list)
    confidence: float = 0.95
    needs_review: bool = False


class PrescriptionAlertSchema(BaseModel):
    code: str
    severity: str  # CRITICAL, WARNING, INFO
    message: str


class PatientContextSchema(BaseModel):
    id: Optional[str] = None
    patient_id: Optional[str] = None
    name: Optional[str] = None
    age: int = 45
    gender: Optional[str] = "Male"
    weight_kg: Optional[float] = None
    creatinine: Optional[float] = None
    egfr: Optional[float] = None
    hba1c: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    alt_ast: Optional[str] = None
    conditions: List[str] = Field(default_factory=list)
    current_medications: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    pregnancy: Optional[bool] = False


class DrugInteractionSchema(BaseModel):
    id: str
    drug_a: str
    drug_b: str
    severity: str  # CRITICAL, HIGH, MODERATE, LOW, INFORMATIONAL
    mechanism: Optional[str] = None
    clinical_significance: str
    evidence_source: str
    recommended_action: str
    management_protocol: Optional[str] = None


class ShapContributionSchema(BaseModel):
    feature: str
    value: Any
    impact_score: float
    category: str  # Renal, Dosage, Interaction, Patient Condition, Age, Duration
    clinical_explanation: str


class SaferAlternativeSchema(BaseModel):
    original_brand: str
    original_generic: str
    alternative_brand: str
    alternative_generic: str
    clinical_rationale: str
    safety_benefit: str
    precautions: str
    requires_clinician_approval: bool = True


class EvidenceCitationSchema(BaseModel):
    source: str
    title: str
    year: int
    url: Optional[str] = None


class ClinicalRiskAnalysisSchema(BaseModel):
    risk_score: float  # 0 - 100
    risk_classification: str  # LOW, MODERATE, HIGH, CRITICAL
    calibrated_probability_note: str
    is_synthetic_demo: bool = False
    aki_risk_percentage: Optional[float] = None
    gi_bleed_risk_percentage: Optional[float] = None
    cardiovascular_risk_percentage: Optional[float] = None
    shap_features: List[ShapContributionSchema] = Field(default_factory=list)
    patient_specific_factors: List[str] = Field(default_factory=list)
    evidence_citations: List[EvidenceCitationSchema] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)


class BanglaMedicineInstructionSchema(BaseModel):
    brand_name: str
    generic_name: str
    bengali_brand_name: Optional[str] = None
    dosage_bengali: str
    timing_bengali: str
    duration_bengali: str
    purpose_bengali: str
    safety_warnings_bengali: List[str] = Field(default_factory=list)
    missed_dose_advice_bengali: str


class BanglaPatientCompanionSchema(BaseModel):
    patient_name_bengali: Optional[str] = None
    patient_id: str
    date_bengali: str
    overview_bengali: str
    medicines: List[BanglaMedicineInstructionSchema] = Field(default_factory=list)
    critical_safety_notice_bengali: str
    emergency_instructions_bengali: str
    clinician_reviewed: bool = False
    reviewer_name: Optional[str] = None


class AnalysisMetaSchema(BaseModel):
    votes: int = 1
    latency_ms: int = 120
    ocr_engine: str = "PredictRx Hybrid Vision Pipeline v1.0"
    legibility: float = 0.95
    is_prescription: bool = True


class AnalysisSummarySchema(BaseModel):
    medicine_count: int
    syntax_errors_count: int
    critical_issues_count: int
    needs_review_count: int
    legibility: float
    overall_safety_rating: str  # SAFE, CAUTION_REQUIRED, HIGH_RISK_INTERVENTION_NEEDED


class ClinicianReviewStateSchema(BaseModel):
    reviewed: bool = False
    reviewer_name: Optional[str] = None
    reviewer_license: Optional[str] = None
    review_timestamp: Optional[str] = None
    notes: Optional[str] = None
    decision: Optional[str] = None  # APPROVED, MODIFIED, REJECTED


class PrescriptionAnalysisResult(BaseModel):
    """Complete CDSS prescription analysis result response."""

    analysis_id: str
    prescription_id: str
    timestamp: str
    image_url: Optional[str] = None
    file_name: Optional[str] = None
    status: str = "COMPLETED"  # PENDING, EXTRACTED, VALIDATED, COMPLETED, FAILED
    meta: AnalysisMetaSchema
    detected_patient: Dict[str, Any] = Field(default_factory=dict)
    patient_context: PatientContextSchema
    extracted_prescription: List[ValidatedMedicineSchema] = Field(default_factory=list)
    prescription_level_alerts: List[PrescriptionAlertSchema] = Field(default_factory=list)
    drug_interactions: List[DrugInteractionSchema] = Field(default_factory=list)
    clinical_risk: ClinicalRiskAnalysisSchema
    safer_alternatives: List[SaferAlternativeSchema] = Field(default_factory=list)
    bangla_companion: BanglaPatientCompanionSchema
    summary: AnalysisSummarySchema
    clinician_review: ClinicianReviewStateSchema

    # Section 4.1 Blueprint Harmonization Fields
    interaction_and_contraindication_alerts: List[Dict[str, Any]] = Field(default_factory=list)
    predictive_risk_analysis: Optional[Dict[str, Any]] = None
    bangla_patient_summary: Optional[Dict[str, Any]] = None


class ClinicianReviewSubmission(BaseModel):
    """Payload when clinician signs off or modifies analysis."""

    reviewer_name: str
    reviewer_license: Optional[str] = None
    decision: str = Field(..., description="APPROVED, MODIFIED, REJECTED")
    notes: Optional[str] = None
