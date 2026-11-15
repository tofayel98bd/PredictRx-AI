"""Primary API router bundling all v1 endpoints."""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    dashboard,
    drugs,
    evidence,
    health,
    interactions,
    patients,
    predict_rx,
    reports,
)

api_router = APIRouter()

# Health & Diagnostics
api_router.include_router(health.router, tags=["Health"])

# Authentication & User Management
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# PredictRx CDSS Core Analysis Pipeline
api_router.include_router(predict_rx.router, prefix="/predict-rx", tags=["PredictRx CDSS"])

# Patient Records & Clinical Profiles
api_router.include_router(patients.router, prefix="/patients", tags=["Patients"])

# Drug-Drug Interaction Matrix & Verification
api_router.include_router(interactions.router, prefix="/drug-interactions", tags=["Drug Interactions"])

# DGDA Bangladesh Drug Catalog
api_router.include_router(drugs.router, prefix="/drugs", tags=["DGDA Drugs Catalog"])

# Clinical Evidence Guidelines & Citations
api_router.include_router(evidence.router, prefix="/evidence", tags=["Clinical Evidence"])

# Dashboard Metrics
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

# Clinical Reports & Audits
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
