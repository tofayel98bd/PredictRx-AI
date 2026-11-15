"""Bangladesh DGDA drug catalog schemas."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class DrugCatalogBase(BaseModel):
    brand_name: str
    generic_name: str
    strength: str
    dosage_form: str
    dgda_dar: Optional[str] = None
    manufacturer: str
    therapeutic_class: Optional[str] = None
    indications: List[str] = Field(default_factory=list)
    adult_dose_standard: Optional[str] = None
    max_daily_dose_mg: Optional[float] = None
    contraindications: List[str] = Field(default_factory=list)
    renal_dose_adjustment: Optional[str] = None
    hepatic_dose_adjustment: Optional[str] = None
    is_controlled: bool = False
    is_active: bool = True


class DrugCatalogCreate(DrugCatalogBase):
    pass


class DrugCatalogResponse(DrugCatalogBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class DrugNormalizationResult(BaseModel):
    """Result of normalizing an extracted brand name to generic catalog."""

    brand_name: str
    generic_name: Optional[str] = None
    catalog_id: Optional[UUID] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    manufacturer: Optional[str] = None
    therapeutic_class: Optional[str] = None
    max_daily_dose_mg: Optional[float] = None
    is_matched: bool = False
    confidence: float = 0.0
    normalized_source: str = "database"  # database | seed_fallback | raw
