"""Prescription master and itemized medication models."""

from typing import List, Optional
import uuid
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Prescription(Base, UUIDMixin, TimestampMixin):
    """Prescription document and analysis subject."""

    __tablename__ = "prescriptions"

    prescription_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    doctor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    raw_ocr_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parsing_confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, analyzed, reviewed, rejected

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="prescriptions")  # type: ignore[name-defined]
    doctor: Mapped[Optional["User"]] = relationship("User", back_populates="prescriptions")  # type: ignore[name-defined]
    medications: Mapped[List["PrescriptionMedication"]] = relationship(
        "PrescriptionMedication",
        back_populates="prescription",
        cascade="all, delete-orphan",
    )
    analysis: Mapped[Optional["PrescriptionAnalysis"]] = relationship(  # type: ignore[name-defined]
        "PrescriptionAnalysis",
        back_populates="prescription",
        uselist=False,
        cascade="all, delete-orphan",
    )
    audit_logs: Mapped[List["PrescriptionAuditLog"]] = relationship(  # type: ignore[name-defined]
        "PrescriptionAuditLog",
        back_populates="prescription",
        cascade="all, delete-orphan",
    )


class PrescriptionMedication(Base, UUIDMixin):
    """Normalized line-item medication extracted or prescribed."""

    __tablename__ = "prescription_medications"

    prescription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    brand_name: Mapped[str] = mapped_column(String(255), nullable=False)
    matched_generic_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bd_drugs_catalog.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    generic_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    strength: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    dosage_form: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    dose: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    frequency: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., 1+0+1
    route: Mapped[str] = mapped_column(String(50), default="Oral", nullable=False)
    duration: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., 5 days
    duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # e.g., after meal
    is_bd_catalog_match: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    normalization_confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    raw_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    prescription: Mapped["Prescription"] = relationship("Prescription", back_populates="medications")
    catalog_drug: Mapped[Optional["BDDrugCatalog"]] = relationship("BDDrugCatalog", back_populates="matched_medications")  # type: ignore[name-defined]
