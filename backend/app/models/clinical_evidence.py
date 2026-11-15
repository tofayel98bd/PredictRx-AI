"""Clinical evidence and citation reference model."""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class ClinicalEvidence(Base, UUIDMixin):
    """Citation-backed clinical guidelines, trials, and pharmacovigilance alerts."""

    __tablename__ = "clinical_evidence"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    publication_type: Mapped[str] = mapped_column(String(100), nullable=False)  # guideline, randomized_trial, meta_analysis, regulatory_alert
    authors: Mapped[str] = mapped_column(String(500), nullable=False)
    journal_or_source: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., KDIGO 2024, BNF 86, DGDA Notice
    pmid_or_doi: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    pub_year: Mapped[int] = mapped_column(Integer, nullable=False)
    evidence_level: Mapped[str] = mapped_column(String(10), default="A", nullable=False)  # A, B, C, D
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
