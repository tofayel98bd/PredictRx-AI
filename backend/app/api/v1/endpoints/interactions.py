"""Drug-drug interaction matrix and direct check endpoints."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.interaction_repo import InteractionRepository
from app.schemas.analysis import DrugInteractionSchema
from app.schemas.interaction import DrugInteractionItem, InteractionCheckRequest
from app.services.interaction_service import InteractionService

router = APIRouter()


@router.get("", response_model=List[DrugInteractionItem], summary="List Known Drug Interactions")
def list_interactions(
    search: Optional[str] = Query(None, description="Search by drug name or clinical effect"),
    severity: Optional[str] = Query(None, description="Filter by severity e.g. CRITICAL, HIGH, ALL"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> List[DrugInteractionItem]:
    """Retrieve cataloged drug interactions with search and severity filters."""
    repo = InteractionRepository(db)
    items = repo.list_interactions(search=search, severity=severity, skip=skip, limit=limit)
    return [
        DrugInteractionItem(
            id=str(i.id),
            drug_a=i.drug_a_generic.title(),
            drug_b=i.drug_b_generic.title(),
            severity=i.severity.upper(),
            mechanism=i.mechanism,
            clinical_significance=i.clinical_effect,
            evidence_source=f"Clinical Evidence ({i.evidence_level})",
            recommended_action=i.management_recommendation,
            management_protocol="Clinical Review Required",
        )
        for i in items
    ]


@router.post("/check", response_model=List[DrugInteractionItem], summary="Check Interactions Direct")
def check_interactions_direct(
    check_req: InteractionCheckRequest,
    db: Session = Depends(get_db),
) -> List[DrugInteractionItem]:
    """
    Directly evaluate combinations and polypharmacy risks for an arbitrary list of medications.
    """
    service = InteractionService(db)
    results = service.evaluate_interactions(check_req.drugs)
    return [
        DrugInteractionItem(
            id=r.id,
            drug_a=r.drug_a,
            drug_b=r.drug_b,
            severity=r.severity,
            mechanism=r.mechanism,
            clinical_significance=r.clinical_significance,
            evidence_source=r.evidence_source,
            recommended_action=r.recommended_action,
            management_protocol=r.management_protocol,
        )
        for r in results
    ]


@router.get("/{id}", response_model=DrugInteractionItem, summary="Get Interaction Details by ID")
def get_interaction_by_id(id: str, db: Session = Depends(get_db)) -> DrugInteractionItem:
    """Retrieve an interaction record by its UUID."""
    repo = InteractionRepository(db)
    try:
        u = UUID(id)
        item = repo.get_by_id(u)
    except ValueError:
        item = None

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interaction rule '{id}' not found.",
        )

    return DrugInteractionItem(
        id=str(item.id),
        drug_a=item.drug_a_generic.title(),
        drug_b=item.drug_b_generic.title(),
        severity=item.severity.upper(),
        mechanism=item.mechanism,
        clinical_significance=item.clinical_effect,
        evidence_source=f"PredictRx Matrix ({item.evidence_level})",
        recommended_action=item.management_recommendation,
        management_protocol="Standard Hospital Protocol",
    )
