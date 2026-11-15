"""Prescription and analysis persistence repository."""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.analysis import PrescriptionAnalysis
from app.models.audit_log import PrescriptionAuditLog
from app.models.prescription import Prescription, PrescriptionMedication


class PrescriptionRepository:
    """Repository handling prescription records, medications, analysis results, and audit trails."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, prescription_id: UUID) -> Optional[Prescription]:
        stmt = (
            select(Prescription)
            .options(
                joinedload(Prescription.patient),
                joinedload(Prescription.doctor),
                selectinload(Prescription.medications),
                joinedload(Prescription.analysis),
            )
            .where(Prescription.id == prescription_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_number(self, prescription_number: str) -> Optional[Prescription]:
        stmt = (
            select(Prescription)
            .options(
                joinedload(Prescription.patient),
                joinedload(Prescription.doctor),
                selectinload(Prescription.medications),
                joinedload(Prescription.analysis),
            )
            .where(Prescription.prescription_number == prescription_number.strip())
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_analysis_by_prescription_id(self, prescription_id: UUID) -> Optional[PrescriptionAnalysis]:
        stmt = (
            select(PrescriptionAnalysis)
            .options(joinedload(PrescriptionAnalysis.prescription))
            .where(PrescriptionAnalysis.prescription_id == prescription_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_analysis_by_id(self, analysis_id: UUID) -> Optional[PrescriptionAnalysis]:
        stmt = (
            select(PrescriptionAnalysis)
            .options(
                joinedload(PrescriptionAnalysis.prescription).joinedload(Prescription.patient),
                joinedload(PrescriptionAnalysis.prescription).selectinload(Prescription.medications),
            )
            .where(PrescriptionAnalysis.id == analysis_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_prescriptions(
        self,
        patient_id: Optional[UUID] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Prescription]:
        stmt = (
            select(Prescription)
            .options(
                joinedload(Prescription.patient),
                joinedload(Prescription.doctor),
                selectinload(Prescription.medications),
                joinedload(Prescription.analysis),
            )
            .order_by(Prescription.created_at.desc())
        )
        if patient_id:
            stmt = stmt.where(Prescription.patient_id == patient_id)
        if status:
            stmt = stmt.where(Prescription.status == status)

        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().unique().all())

    def create_prescription(
        self,
        prescription: Prescription,
        medications: Optional[List[PrescriptionMedication]] = None,
    ) -> Prescription:
        self.db.add(prescription)
        self.db.flush()
        if medications:
            for med in medications:
                med.prescription_id = prescription.id
                self.db.add(med)
        self.db.commit()
        self.db.refresh(prescription)
        return prescription

    def save_analysis(self, analysis: PrescriptionAnalysis) -> PrescriptionAnalysis:
        existing = self.db.execute(
            select(PrescriptionAnalysis).where(
                PrescriptionAnalysis.prescription_id == analysis.prescription_id
            )
        ).scalar_one_or_none()

        if existing:
            existing.overall_risk_score = analysis.overall_risk_score
            existing.risk_level = analysis.risk_level
            existing.findings_summary = analysis.findings_summary
            existing.detected_interactions = analysis.detected_interactions
            existing.drug_disease_conflicts = analysis.drug_disease_conflicts
            existing.dosing_issues = analysis.dosing_issues
            existing.contraindications = analysis.contraindications
            existing.shap_risk_factors = analysis.shap_risk_factors
            existing.safer_alternatives = analysis.safer_alternatives
            existing.patient_bangla_explanation = analysis.patient_bangla_explanation
            existing.patient_english_explanation = analysis.patient_english_explanation
            self.db.commit()
            self.db.refresh(existing)
            return existing

        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        return analysis

    def log_audit(
        self,
        prescription_id: UUID,
        action: str,
        user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        details: Optional[dict] = None,
    ) -> PrescriptionAuditLog:
        log = PrescriptionAuditLog(
            prescription_id=prescription_id,
            action=action,
            user_id=user_id,
            ip_address=ip_address,
            details=details or {},
        )
        self.db.add(log)
        self.db.commit()
        return log

    def count_total(self) -> int:
        return self.db.scalar(select(func.count(Prescription.id))) or 0

    def count_by_risk_level(self, level: str) -> int:
        return (
            self.db.scalar(
                select(func.count(PrescriptionAnalysis.id)).where(
                    PrescriptionAnalysis.risk_level == level
                )
            )
            or 0
        )

    def count_pending_reviews(self) -> int:
        return (
            self.db.scalar(
                select(func.count(PrescriptionAnalysis.id)).where(
                    PrescriptionAnalysis.clinician_review_status == "pending"
                )
            )
            or 0
        )
