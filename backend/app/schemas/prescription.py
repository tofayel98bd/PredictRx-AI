"""Prescription schemas and medication line-item specifications."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class PrescriptionMedicationBase(BaseModel):
    brand_name: str
    generic_name: Optional[str] = None
    strength: Optional[str] = None
    dosage_form: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None  # e.g., "1+0+1"
    route: str = "Oral"
    duration: Optional[str] = None  # e.g., "5 days"
    duration_days: Optional[int] = None
    instructions: Optional[str] = None  # e.g., "After meal"


class PrescriptionMedicationCreate(PrescriptionMedicationBase):
    raw_token: Optional[str] = None


class PrescriptionMedicationResponse(PrescriptionMedicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    prescription_id: UUID
    matched_generic_id: Optional[UUID] = None
    is_bd_catalog_match: bool
    normalization_confidence: float
    created_at: datetime


class PrescriptionCreate(BaseModel):
    prescription_number: str
    patient_id: UUID
    doctor_id: Optional[UUID] = None
    raw_ocr_text: Optional[str] = None
    medications: List[PrescriptionMedicationCreate] = Field(default_factory=list)


class PrescriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    prescription_number: str
    patient_id: UUID
    doctor_id: Optional[UUID] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    file_hash: Optional[str] = None
    raw_ocr_text: Optional[str] = None
    parsing_confidence: float
    status: str
    medications: List[PrescriptionMedicationResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class PrescriptionUploadResponse(BaseModel):
    prescription_id: UUID
    prescription_number: str
    filename: str
    file_hash: str
    file_size_bytes: int
    content_type: str
    status: str
