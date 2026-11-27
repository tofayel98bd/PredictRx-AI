"""Health check and diagnostic endpoint."""

from typing import Any, Dict
from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.core.constants import MEDICAL_SAFETY_DISCLAIMER

router = APIRouter()


@router.get("/health", summary="System Health & Connectivity Check")
def get_health() -> Dict[str, Any]:
    """
    Returns API status, database connectivity status, and application version.
    Does not expose sensitive credentials or connection strings.
    """
    db_status = "unconfigured"
    db_details = None
    try:
        from app.db.session import check_database_connection
        db_details = check_database_connection()
        db_status = "connected" if db_details.get("status") == "healthy" else "disconnected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "api_status": "online",
        "database_status": db_status,
        "database_info": db_details,
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "clinical_safety": "active",
        "disclaimer": MEDICAL_SAFETY_DISCLAIMER,
    }


@router.get("/ready", summary="Production Readiness Probe")
def get_readiness(response: Response) -> Dict[str, Any]:
    """Readiness probe verifying DB, DGDA catalog seed, and ML risk predictor availability."""
    checks: Dict[str, Any] = {"database": False, "dgda_catalog_count": 0, "ml_model_loaded": False}
    try:
        from sqlalchemy import func, select
        from app.db.session import SessionLocal, check_database_connection
        from app.models.drug import BDDrugCatalog
        from app.ml.risk_predictor import ClinicalRiskPredictor

        db_ok = check_database_connection().get("status") == "healthy"
        checks["database"] = db_ok
        if db_ok:
            with SessionLocal() as db:
                checks["dgda_catalog_count"] = int(db.scalar(select(func.count(BDDrugCatalog.id))) or 0)
        checks["ml_model_loaded"] = ClinicalRiskPredictor().model is not None
    except Exception:
        pass

    ready = bool(checks["database"] and checks["dgda_catalog_count"] > 0 and checks["ml_model_loaded"])
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"ready": ready, "checks": checks, "version": settings.PROJECT_VERSION}
