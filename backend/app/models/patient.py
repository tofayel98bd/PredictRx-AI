"""Patient demographic and clinical profile models."""

from datetime import datetime, timezone
from typing import List, Optional
import uuid
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Patient(Base, UUIDMixin, TimestampMixin):
    """Patient demographic master record."""

    __tablename__ = "patients"

    mrn: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)  # e.g., PRX-2026-0001
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)  # male, female, other
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    clinical_profile: Mapped[Optional["PatientClinicalProfile"]] = relationship(
        "PatientClinicalProfile",
        back_populates="patient",
        uselist=False,
        cascade="all, delete-orphan",
    )
    prescriptions: Mapped[List["Prescription"]] = relationship(  # type: ignore[name-defined]
        "Prescription",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


class PatientClinicalProfile(Base, UUIDMixin):
    """Patient clinical attributes, lab parameters, and medical history."""

    __tablename__ = "patient_clinical_profiles"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    egfr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # mL/min/1.73m2
    serum_creatinine: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # mg/dL
    alt: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # U/L
    ast: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # U/L
    chronic_conditions: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)  # ["CKD Stage 3b", "Hypertension"]
    known_allergies: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)  # ["Penicillin", "NSAIDs"]
    is_pregnant: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_lactating: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    smoking_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # never, former, active
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship
    patient: Mapped["Patient"] = relationship("Patient", back_populates="clinical_profile")
