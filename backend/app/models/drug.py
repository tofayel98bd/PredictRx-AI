"""Bangladesh Directorate General of Drug Administration (DGDA) drug catalog model."""

from typing import List, Optional
from sqlalchemy import Boolean, Float, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class BDDrugCatalog(Base, UUIDMixin, TimestampMixin):
    """Normalized Bangladesh drug brand and generic repository."""

    __tablename__ = "bd_drugs_catalog"

    brand_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    generic_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    strength: Mapped[str] = mapped_column(String(100), nullable=False)
    dosage_form: Mapped[str] = mapped_column(String(100), nullable=False)  # Tablet, Capsule, Syrup, Injection
    dgda_dar: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)  # DGDA Registration No
    manufacturer: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., Square, Beximco, Incepta
    therapeutic_class: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    indications: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    adult_dose_standard: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    max_daily_dose_mg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    contraindications: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    renal_dose_adjustment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hepatic_dose_adjustment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_controlled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    matched_medications: Mapped[List["PrescriptionMedication"]] = relationship(  # type: ignore[name-defined]
        "PrescriptionMedication",
        back_populates="catalog_drug",
    )
