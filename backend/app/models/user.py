"""User model for authentication and role-based access control."""

from typing import List, Optional
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class User(Base, UUIDMixin, TimestampMixin):
    """Healthcare professional or system user."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="doctor", nullable=False)  # doctor, clinical_pharmacist, reviewer, admin
    bmdc_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)  # Bangladesh Medical & Dental Council reg
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    prescriptions: Mapped[List["Prescription"]] = relationship(  # type: ignore[name-defined]
        "Prescription",
        back_populates="doctor",
        foreign_keys="Prescription.doctor_id",
    )
    reviewed_analyses: Mapped[List["PrescriptionAnalysis"]] = relationship(  # type: ignore[name-defined]
        "PrescriptionAnalysis",
        back_populates="reviewer",
        foreign_keys="PrescriptionAnalysis.reviewed_by",
    )
    audit_logs: Mapped[List["PrescriptionAuditLog"]] = relationship(  # type: ignore[name-defined]
        "PrescriptionAuditLog",
        back_populates="user",
        foreign_keys="PrescriptionAuditLog.user_id",
    )
