"""Bangladesh DGDA drug catalog endpoints."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.drug_repo import DrugRepository
from app.schemas.drug import DrugCatalogCreate, DrugCatalogResponse

router = APIRouter()


@router.get("", response_model=List[DrugCatalogResponse], summary="List & Search DGDA Drug Catalog")
def list_drugs(
    search: Optional[str] = Query(None, description="Search by brand name, generic name, or manufacturer"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> List[DrugCatalogResponse]:
    """Retrieve cataloged Bangladesh medicines from DGDA master data."""
    repo = DrugRepository(db)
    drugs = repo.list(search=search, skip=skip, limit=limit)
    return [DrugCatalogResponse.model_validate(d) for d in drugs]


@router.get("/{id}", response_model=DrugCatalogResponse, summary="Get Drug Catalog Entry by ID")
def get_drug_by_id(id: UUID, db: Session = Depends(get_db)) -> DrugCatalogResponse:
    """Retrieve details for a specific drug catalog entry."""
    repo = DrugRepository(db)
    drug = repo.get_by_id(id)
    if not drug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Drug with ID '{id}' not found in catalog.",
        )
    return DrugCatalogResponse.model_validate(drug)
