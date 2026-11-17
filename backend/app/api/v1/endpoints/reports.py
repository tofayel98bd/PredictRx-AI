"""Clinical audit and report export endpoints."""

import os
from typing import Any, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_language
from app.api.v1.endpoints.predict_rx import _format_analysis_result
from app.core.constants import MEDICAL_SAFETY_DISCLAIMER
from app.db.session import get_db
from app.i18n.translator import t
from app.repositories.prescription_repo import PrescriptionRepository
from app.services.pdf_report_service import pdf_report_service

router = APIRouter()


@router.get("/{prescription_id}", summary="Get Full Clinical Report Summary")
def get_clinical_report(
    prescription_id: str,
    db: Session = Depends(get_db),
    lang: str = Depends(get_language),
) -> Dict[str, Any]:
    """Retrieve structured audit report for clinical review and printing in requested language."""
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
            detail=t("reports.report_not_found", lang=lang, prescription_id=prescription_id),
        )

    formatted = _format_analysis_result(rx, rx.analysis)
    return {
        "report_id": f"REP-{rx.prescription_number}",
        "language": lang,
        "generated_at": rx.analysis.updated_at.isoformat(),
        "safety_disclaimer": t("reports.safety_disclaimer", lang=lang),
        "prescription_data": formatted.model_dump(),
    }


@router.get("/{prescription_id}/pdf", summary="Export Clinical Audit PDF Report")
def export_clinical_report_pdf(
    prescription_id: str,
    db: Session = Depends(get_db),
    lang: str = Depends(get_language),
):
    """
    Generate and stream a high-resolution, print-ready PDF clinical audit report
    supporting English (en) or বাংলা (bn) with full Unicode typography.
    """
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
            detail=t("reports.report_not_found", lang=lang, prescription_id=prescription_id),
        )

    formatted = _format_analysis_result(rx, rx.analysis)
    report_dict = {
        "report_id": f"REP-{rx.prescription_number}",
        "language": lang,
        "generated_at": rx.analysis.updated_at.isoformat(),
        "prescription_data": formatted.model_dump(),
    }

    try:
        pdf_path = pdf_report_service.generate_pdf(report_dict, lang=lang)
        filename = f"PredictRx_Report_{rx.prescription_number}_{lang}.pdf"
        return FileResponse(
            path=pdf_path,
            filename=filename,
            media_type="application/pdf",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(exc)}",
        )
