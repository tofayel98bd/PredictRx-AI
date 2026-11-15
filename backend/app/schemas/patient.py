"""Patient and clinical profile schemas."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ClinicalProfileBase(BaseModel):
    """Base fields for patient clinical lab profile."""

    egfr: Optional[float] = Field(None, ge=0, le=200, description="eGFR in mL/min/1.73m2")
    serum_creatinine: Optional[float] = Field(None, ge=0, le=30, description="Serum creatinine in mg/dL")
    alt: Optional[float] = Field(None, ge=0, le=1000, description="Alanine aminotransferase U/L")
    ast: Optional[float] = Field(None, ge=0, le=1000, description="Aspartate aminotransferase U/L")
    chronic_conditions: List[str] = Field(default_factory=list)
    known_allergies: List[str] = Field(default_factory=list)
    is_pregnant: bool = False
    is_lactating: bool = False
    smoking_status: Optional[str] = Field(None, description="never, former, active")


class ClinicalProfileCreate(ClinicalProfileBase):
    pass


class ClinicalProfileResponse(ClinicalProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    recorded_at: datetime
    updated_at: datetime


class PatientBase(BaseModel):
    """Base fields for patient demographics."""

    mrn: str = Field(..., max_length=50, description="Medical Record Number e.g. PRX-2026-0001")
    full_name: str = Field(..., max_length=255)
    age: int = Field(..., ge=0, le=130)
    gender: str = Field(..., description="male, female, other")
    weight_kg: Optional[float] = Field(None, ge=1, le=400)
    height_cm: Optional[float] = Field(None, ge=20, le=280)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=255)


class PatientCreate(PatientBase):
    clinical_profile: Optional[ClinicalProfileCreate] = None


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    clinical_profile: Optional[ClinicalProfileBase] = None


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    clinical_profile: Optional[ClinicalProfileResponse] = None
    created_at: datetime
    updated_at: datetime


class PatientFrontendItem(BaseModel):
    """Frontend-compatible Patient card model matching frontend/src/types/index.ts."""

    id: str
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    blood_group: Optional[str] = "O+"
    creatinine: float = 1.0
    egfr: float = 90.0
    hba1c: float = 5.7
    conditions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    active_prescriptions_count: int = 0
    last_analyzed: str = "Recently"
    risk_level: str = "LOW"
