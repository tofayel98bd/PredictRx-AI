"""Drug-drug interaction matrix schemas."""

from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class InteractionCheckRequest(BaseModel):
    """Payload to check interactions among a list of drug generic or brand names."""

    drugs: List[str] = Field(..., min_length=1, description="List of drug names or active ingredients")


class DrugInteractionItem(BaseModel):
    """Standard frontend-compatible interaction representation."""

    id: str
    drug_a: str
    drug_b: str
    severity: str = Field(..., description="CRITICAL, HIGH, MODERATE, LOW, INFORMATIONAL")
    mechanism: Optional[str] = None
    clinical_significance: str
    evidence_source: str
    recommended_action: str
    management_protocol: Optional[str] = None


class InteractionMatrixResponse(BaseModel):
    """Internal database interaction matrix response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    drug_a_generic: str
    drug_b_generic: str
    severity: str
    clinical_effect: str
    mechanism: str
    evidence_level: str
    management_recommendation: str
    citation_ids: List[str] = Field(default_factory=list)
    is_contraindicated: bool
