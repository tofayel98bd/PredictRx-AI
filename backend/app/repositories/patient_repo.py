"""Patient and clinical profile repository."""

from typing import List, Optional
from uuid import UUID
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.patient import Patient, PatientClinicalProfile


class PatientRepository:
    """Repository handling patient demographics and clinical profile records."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, patient_id: UUID) -> Optional[Patient]:
        stmt = (
            select(Patient)
            .options(joinedload(Patient.clinical_profile))
            .where(Patient.id == patient_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_mrn(self, mrn: str) -> Optional[Patient]:
        stmt = (
            select(Patient)
            .options(joinedload(Patient.clinical_profile))
            .where(Patient.mrn == mrn.strip())
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Patient]:
        stmt = select(Patient).options(joinedload(Patient.clinical_profile))
        if search and search.strip():
            query = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    Patient.full_name.ilike(query),
                    Patient.mrn.ilike(query),
                    Patient.phone.ilike(query),
                )
            )
        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().unique().all())

    def create(self, patient: Patient, profile: Optional[PatientClinicalProfile] = None) -> Patient:
        self.db.add(patient)
        self.db.flush()
        if profile:
            profile.patient_id = patient.id
            self.db.add(profile)
        self.db.commit()
        self.db.refresh(patient)
        return patient

    def update_profile(self, patient_id: UUID, profile_data: dict) -> Optional[PatientClinicalProfile]:
        profile = self.db.execute(
            select(PatientClinicalProfile).where(PatientClinicalProfile.patient_id == patient_id)
        ).scalar_one_or_none()

        if not profile:
            profile = PatientClinicalProfile(patient_id=patient_id, **profile_data)
            self.db.add(profile)
        else:
            for k, v in profile_data.items():
                if hasattr(profile, k) and v is not None:
                    setattr(profile, k, v)
        self.db.commit()
        self.db.refresh(profile)
        return profile
