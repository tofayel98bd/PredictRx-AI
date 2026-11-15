"""Dashboard summary metrics schemas."""

from typing import Any, Dict, List
from pydantic import BaseModel, Field


class DashboardOverviewResponse(BaseModel):
    """Aggregated clinical metrics for dashboard overview."""

    total_prescriptions_analyzed: int
    critical_interventions_count: int
    high_risk_patients_count: int
    pending_clinician_reviews: int
    dgda_drug_catalog_count: int
    active_interaction_rules_count: int
    recent_analyses: List[Dict[str, Any]] = Field(default_factory=list)
