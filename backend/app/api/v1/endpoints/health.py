"""Health check and diagnostic endpoint."""

from typing import Any, Dict
from fastapi import APIRouter
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
