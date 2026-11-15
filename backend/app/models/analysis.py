"""Comprehensive CDSS prescription analysis and risk assessment model."""

from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class PrescriptionAnalysis(Base, UUIDMixin, TimestampMixin):
    """Clinical Decision Support System (CDSS) analysis results."""

    __tablename__ = "prescription_analyses"

    prescription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    overall_risk_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 - 100.0
    risk_level: Mapped[str] = mapped_column(String(50), nullable=False)  # low, moderate, high, critical
    findings_summary: Mapped[str] = mapped_column(Text, nullable=False)

    # Detailed clinical findings and explainability arrays
    detected_interactions: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    drug_disease_conflicts: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    dosing_issues: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    contraindications: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    shap_risk_factors: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    safer_alternatives: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    # Patient explanations
    patient_bangla_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    patient_english_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Clinician Sign-off & Audit
    clinician_review_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, approved, modified, rejected
    clinician_review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    prescription: Mapped["Prescription"] = relationship("Prescription", back_populates="analysis")  # type: ignore[name-defined]
    reviewer: Mapped[Optional["User"]] = relationship("User", back_populates="reviewed_analyses")  # type: ignore[name-defined]
