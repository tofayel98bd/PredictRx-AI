"""Patient management and clinical history endpoints."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints.predict_rx import _format_analysis_result
from app.db.session import get_db
from app.models.patient import Patient, PatientClinicalProfile
from app.repositories.patient_repo import PatientRepository
from app.repositories.prescription_repo import PrescriptionRepository
from app.schemas.analysis import PrescriptionAnalysisResult
from app.schemas.patient import (
    PatientCreate,
    PatientFrontendItem,
    PatientResponse,
    PatientUpdate,
)

router = APIRouter()


@router.get("", response_model=List[PatientFrontendItem], summary="List Patients (Frontend Card Format)")
def list_patients(
    search: Optional[str] = Query(None, description="Search by name, MRN, or phone"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> List[PatientFrontendItem]:
    """Retrieve list of patients formatted for frontend display cards."""
    repo = PatientRepository(db)
    patients = repo.list(search=search, skip=skip, limit=limit)
    items: List[PatientFrontendItem] = []

    for p in patients:
        profile = p.clinical_profile
        egfr_val = profile.egfr if profile and profile.egfr is not None else 90.0
        creat_val = profile.serum_creatinine if profile and profile.serum_creatinine is not None else 1.0

        # Assess risk level badge
        risk = "LOW"
        if egfr_val < 30 or (profile and "CKD" in "".join(profile.chronic_conditions)):
            risk = "CRITICAL"
        elif egfr_val < 60:
            risk = "HIGH"
        elif p.age >= 65:
            risk = "MODERATE"

        items.append(
            PatientFrontendItem(
                id=p.mrn,
                name=p.full_name,
                age=p.age,
                gender=p.gender.title(),
                phone=p.phone or "+8801700000000",
                blood_group="B+",
                creatinine=creat_val,
                egfr=egfr_val,
                hba1c=6.5,
                conditions=profile.chronic_conditions if profile else [],
                allergies=profile.known_allergies if profile else [],
                active_prescriptions_count=len(p.prescriptions) if p.prescriptions else 1,
                last_analyzed="Recently",
                risk_level=risk,
            )
        )
    return items


@router.get("/{id}", response_model=PatientFrontendItem, summary="Get Patient Details by ID or MRN")
def get_patient(id: str, db: Session = Depends(get_db)) -> PatientFrontendItem:
    """Retrieve a patient by ID or MRN."""
    repo = PatientRepository(db)
    patient = None
    try:
        patient = repo.get_by_id(UUID(id))
    except ValueError:
        pass

    if not patient:
        patient = repo.get_by_mrn(id)

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{id}' not found.",
        )

    profile = patient.clinical_profile
    egfr_val = profile.egfr if profile and profile.egfr is not None else 90.0
    creat_val = profile.serum_creatinine if profile and profile.serum_creatinine is not None else 1.0

    risk = "LOW"
    if egfr_val < 30 or (profile and "CKD" in "".join(profile.chronic_conditions)):
        risk = "CRITICAL"
    elif egfr_val < 60:
        risk = "HIGH"

    return PatientFrontendItem(
        id=patient.mrn,
        name=patient.full_name,
        age=patient.age,
        gender=patient.gender.title(),
        phone=patient.phone,
        blood_group="B+",
        creatinine=creat_val,
        egfr=egfr_val,
        hba1c=6.5,
        conditions=profile.chronic_conditions if profile else [],
        allergies=profile.known_allergies if profile else [],
        active_prescriptions_count=len(patient.prescriptions) if patient.prescriptions else 0,
        last_analyzed="Recently",
        risk_level=risk,
    )


@router.get("/{patient_id}/prescriptions", response_model=List[PrescriptionAnalysisResult], summary="Get Patient Prescriptions")
def get_patient_prescriptions(patient_id: str, db: Session = Depends(get_db)) -> List[PrescriptionAnalysisResult]:
    """Retrieve all prescriptions analyzed for a specific patient."""
    p_repo = PatientRepository(db)
    rx_repo = PrescriptionRepository(db)

    patient = None
    try:
        patient = p_repo.get_by_id(UUID(patient_id))
    except ValueError:
        pass

    if not patient:
        patient = p_repo.get_by_mrn(patient_id)

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found.",
        )

    prescriptions = rx_repo.list_prescriptions(patient_id=patient.id)
    return [_format_analysis_result(rx, rx.analysis) for rx in prescriptions if rx.analysis]


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED, summary="Create Patient")
def create_patient(patient_in: PatientCreate, db: Session = Depends(get_db)) -> PatientResponse:
    """Create a new patient record with demographic and clinical profile."""
    repo = PatientRepository(db)
    existing = repo.get_by_mrn(patient_in.mrn)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Patient with MRN '{patient_in.mrn}' already exists.",
        )

    patient = Patient(
        mrn=patient_in.mrn,
        full_name=patient_in.full_name,
        age=patient_in.age,
        gender=patient_in.gender.lower(),
        weight_kg=patient_in.weight_kg,
        height_cm=patient_in.height_cm,
        phone=patient_in.phone,
        address=patient_in.address,
    )

    profile = None
    if patient_in.clinical_profile:
        profile = PatientClinicalProfile(
            egfr=patient_in.clinical_profile.egfr,
            serum_creatinine=patient_in.clinical_profile.serum_creatinine,
            alt=patient_in.clinical_profile.alt,
            ast=patient_in.clinical_profile.ast,
            chronic_conditions=patient_in.clinical_profile.chronic_conditions,
            known_allergies=patient_in.clinical_profile.known_allergies,
            is_pregnant=patient_in.clinical_profile.is_pregnant,
            is_lactating=patient_in.clinical_profile.is_lactating,
            smoking_status=patient_in.clinical_profile.smoking_status,
        )

    created = repo.create(patient, profile)
    return PatientResponse.model_validate(created)
