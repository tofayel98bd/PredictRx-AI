"""Data contracts for Layer 1 (Vision + Syntax Validator)."""
from __future__ import annotations
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


# ---------- What the Vision LLM returns (raw, as-written on paper) ----------
class RawMedicine(BaseModel):
    brand_name: str = Field(description="Brand exactly as written, e.g. 'Napa Extend', 'Sergel 20'")
    form: Optional[str] = Field(None, description="Tab/Cap/Syp/Inj/Drop/Cream/Susp/Inh ... as written")
    strength: Optional[str] = Field(None, description="e.g. '500 mg', '5/20', '10mg'")
    generic_name_guess: Optional[str] = Field(None, description="Generic name if you are confident, else null")
    dosage_raw: Optional[str] = Field(None, description="Dose pattern EXACTLY as written: '1+0+1', '১-০-১', 'BD', 'SOS'")
    timing_raw: Optional[str] = Field(None, description="As written: 'after meal', 'খাবার আগে', 'ac', 'pc', 'HS'")
    duration_raw: Optional[str] = Field(None, description="As written: '14 days', '২ সপ্তাহ', '1 month', 'continue'")
    instructions_raw: Optional[str] = Field(None, description="Any other instruction text for this drug")
    confidence: float = Field(0.8, ge=0, le=1, description="Your confidence the line was read correctly")
    agreement: float = Field(1.0, ge=0, le=1, description="(internal) multi-pass voting agreement")


class RawPrescription(BaseModel):
    is_prescription: bool = True
    legibility: float = Field(0.8, ge=0, le=1, description="Overall readability of the image")
    doctor_name: Optional[str] = None
    prescription_date: Optional[str] = None
    patient_name: Optional[str] = None
    patient_age_years: Optional[float] = None
    patient_gender: Optional[str] = None
    patient_weight_kg: Optional[float] = None
    systolic_bp: Optional[int] = Field(None, description="Systolic blood pressure e.g. 130 in 130/90")
    diastolic_bp: Optional[int] = Field(None, description="Diastolic blood pressure e.g. 90 in 130/90")
    diagnosis_or_cc: Optional[str] = Field(None, description="Diagnosis / chief complaint if written")
    medicines: List[RawMedicine] = Field(default_factory=list)
    notes: Optional[str] = None


# ---------- What the validator produces (matches the team API contract) ----------
Severity = Literal["CRITICAL", "WARNING", "INFO"]


class Issue(BaseModel):
    code: str
    severity: Severity
    message: str


class ValidatedMedicine(BaseModel):
    brand_name: str
    generic_name: Optional[str]
    form: Optional[str] = None
    strength: Optional[str] = None
    dosage_syntax: Optional[str]          # normalized, e.g. "1+0+1"
    frequency_per_day: Optional[float]
    timing: Optional[str]                 # Before Meal / After Meal / ...
    duration_days: Optional[int]
    syntax_valid: bool
    syntax_note: str
    issues: List[Issue] = Field(default_factory=list)
    confidence: float = 0.8
    needs_review: bool = False
