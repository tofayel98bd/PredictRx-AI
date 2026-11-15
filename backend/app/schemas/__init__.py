"""Pydantic schemas registry."""

from app.schemas.common import StandardResponse, PaginatedResponse
from app.schemas.auth import (
    UserLogin,
    UserCreate,
    UserResponse,
    Token,
    TokenPayload,
)
from app.schemas.patient import (
    PatientBase,
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientFrontendItem,
    ClinicalProfileBase,
    ClinicalProfileCreate,
    ClinicalProfileResponse,
)
from app.schemas.drug import (
    DrugCatalogBase,
    DrugCatalogCreate,
    DrugCatalogResponse,
    DrugNormalizationResult,
)
from app.schemas.interaction import (
    InteractionCheckRequest,
    DrugInteractionItem,
    InteractionMatrixResponse,
)
from app.schemas.prescription import (
    PrescriptionMedicationBase,
    PrescriptionMedicationCreate,
    PrescriptionMedicationResponse,
    PrescriptionCreate,
    PrescriptionResponse,
    PrescriptionUploadResponse,
)
from app.schemas.analysis import (
    PrescriptionAnalysisResult,
    ClinicianReviewSubmission,
    PatientContextSchema,
    ValidatedMedicineSchema,
    DrugInteractionSchema,
    SaferAlternativeSchema,
    ClinicalRiskAnalysisSchema,
    BanglaPatientCompanionSchema,
)
from app.schemas.dashboard import DashboardOverviewResponse

__all__ = [
    "StandardResponse",
    "PaginatedResponse",
    "UserLogin",
    "UserCreate",
    "UserResponse",
    "Token",
    "TokenPayload",
    "PatientBase",
    "PatientCreate",
    "PatientUpdate",
    "PatientResponse",
    "PatientFrontendItem",
    "ClinicalProfileBase",
    "ClinicalProfileCreate",
    "ClinicalProfileResponse",
    "DrugCatalogBase",
    "DrugCatalogCreate",
    "DrugCatalogResponse",
    "DrugNormalizationResult",
    "InteractionCheckRequest",
    "DrugInteractionItem",
    "InteractionMatrixResponse",
    "PrescriptionMedicationBase",
    "PrescriptionMedicationCreate",
    "PrescriptionMedicationResponse",
    "PrescriptionCreate",
    "PrescriptionResponse",
    "PrescriptionUploadResponse",
    "PrescriptionAnalysisResult",
    "ClinicianReviewSubmission",
    "PatientContextSchema",
    "ValidatedMedicineSchema",
    "DrugInteractionSchema",
    "SaferAlternativeSchema",
    "ClinicalRiskAnalysisSchema",
    "BanglaPatientCompanionSchema",
    "DashboardOverviewResponse",
]
