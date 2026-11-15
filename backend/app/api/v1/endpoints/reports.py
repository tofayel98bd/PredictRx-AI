"""Clinical audit and report export endpoints."""

from typing import Any, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints.predict_rx import _format_analysis_result
from app.core.constants import MEDICAL_SAFETY_DISCLAIMER
from app.db.session import get_db
from app.repositories.prescription_repo import PrescriptionRepository

router = APIRouter()


@router.get("/{prescription_id}", summary="Get Full Clinical Report Summary")
def get_clinical_report(prescription_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve structured audit report for clinical review and printing."""
    repo = PrescriptionRepository(db)
    rx = None
    try:
        rx = repo.get_by_id(UUID(prescription_id))
    except ValueError:
        pass

    if not rx:
        rx = repo.get_by_number(prescription_id)

    if not rx or not rx.analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report for prescription '{prescription_id}' not found.",
        )

    formatted = _format_analysis_result(rx, rx.analysis)
    return {
        "report_id": f"REP-{rx.prescription_number}",
        "generated_at": rx.analysis.updated_at.isoformat(),
        "safety_disclaimer": MEDICAL_SAFETY_DISCLAIMER,
        "prescription_data": formatted.model_dump(),
    }
