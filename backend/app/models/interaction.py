"""Drug-drug interaction matrix model."""

from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class DrugInteractionMatrix(Base, UUIDMixin):
    """Clinical drug-drug interaction rule matrix."""

    __tablename__ = "drug_interactions_matrix"

    drug_a_generic: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    drug_b_generic: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # critical, high, moderate, minor
    clinical_effect: Mapped[str] = mapped_column(Text, nullable=False)
    mechanism: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_level: Mapped[str] = mapped_column(String(10), default="A", nullable=False)  # A, B, C, D
    management_recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    citation_ids: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    is_contraindicated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
