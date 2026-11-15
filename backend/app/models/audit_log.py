"""Prescription lifecycle and clinical audit trail model."""

from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin


class PrescriptionAuditLog(Base, UUIDMixin):
    """Immutable audit trail for prescription lifecycle and clinical actions."""

    __tablename__ = "prescription_audit_logs"

    prescription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)  # created, uploaded, analyzed, reviewed, exported
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    details: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    prescription: Mapped["Prescription"] = relationship("Prescription", back_populates="audit_logs")  # type: ignore[name-defined]
    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")  # type: ignore[name-defined]
