"""Dashboard overview and system metrics endpoints."""

from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.drug_repo import DrugRepository
from app.repositories.interaction_repo import InteractionRepository
from app.repositories.prescription_repo import PrescriptionRepository
from app.schemas.dashboard import DashboardOverviewResponse

router = APIRouter()


@router.get("/overview", response_model=DashboardOverviewResponse, summary="Get Dashboard Overview Metrics")
def get_dashboard_overview(db: Session = Depends(get_db)) -> DashboardOverviewResponse:
    """Retrieve high-level clinical metrics and analysis counts for the dashboard header."""
    rx_repo = PrescriptionRepository(db)
    drug_repo = DrugRepository(db)
    interaction_repo = InteractionRepository(db)

    total_rx = rx_repo.count_total()
    critical_count = rx_repo.count_by_risk_level("critical")
    high_count = rx_repo.count_by_risk_level("high")
    pending_reviews = rx_repo.count_pending_reviews()
    catalog_count = drug_repo.count()
    rules_count = interaction_repo.count()

    recent_prescriptions = rx_repo.list_prescriptions(limit=5)
    recent_list = [
        {
            "prescription_id": rx.prescription_number,
            "patient_name": rx.patient.full_name if rx.patient else "Unknown",
            "risk_score": rx.analysis.overall_risk_score if rx.analysis else 0,
            "risk_level": rx.analysis.risk_level.upper() if rx.analysis else "UNKNOWN",
            "date": rx.created_at.strftime("%Y-%m-%d %H:%M"),
        }
        for rx in recent_prescriptions
    ]

    return DashboardOverviewResponse(
        total_prescriptions_analyzed=total_rx,
        critical_interventions_count=critical_count,
        high_risk_patients_count=high_count,
        pending_clinician_reviews=pending_reviews,
        dgda_drug_catalog_count=catalog_count,
        active_interaction_rules_count=rules_count,
        recent_analyses=recent_list,
    )
