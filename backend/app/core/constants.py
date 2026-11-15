"""Clinical safety constants, disclaimers, and domain enums."""

from typing import Final, List

MEDICAL_SAFETY_DISCLAIMER: Final[str] = (
    "PredictRx-AI is a clinical decision support tool. It does not replace professional "
    "medical judgment. All clinical decisions must be reviewed by a qualified healthcare professional."
)

CLINICAL_ADVISORY_NOTICE: Final[str] = (
    "Clinical Decision Support Notice: AI-assisted predictions and syntax checks are assistive advisory "
    "indicators. Dosage adjustments, therapeutic substitutions, and contraindication overrides must be "
    "confirmed by the attending registered physician."
)

SEVERITY_LEVELS: Final[List[str]] = [
    "CRITICAL",
    "HIGH",
    "MODERATE",
    "LOW",
    "INFORMATIONAL",
]

PRESCRIPTION_STATUSES: Final[List[str]] = [
    "PENDING",
    "PROCESSING",
    "EXTRACTED",
    "VALIDATED",
    "FAILED",
    "COMPLETED",
]

CLINICAL_DECISION_STATUSES: Final[List[str]] = [
    "APPROVED",
    "MODIFIED",
    "REJECTED",
    "PENDING_REVIEW",
]

USER_ROLES: Final[List[str]] = [
    "clinician",
    "pharmacist",
    "reviewer",
    "admin",
]
