"""Clinical evidence and citation reference endpoints."""

from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.interaction_repo import InteractionRepository

router = APIRouter()


@router.get("", summary="List Clinical Evidence Guidelines")
def list_evidence(
    search: Optional[str] = Query(None, description="Search by title, authors, or journal"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Retrieve indexed clinical evidence guidelines and clinical trials."""
    repo = InteractionRepository(db)
    items = repo.list_evidence(search=search, skip=skip, limit=limit)
    return [
        {
            "id": str(e.id),
            "title": e.title,
            "publication_type": e.publication_type,
            "authors": e.authors,
            "journal_or_source": e.journal_or_source,
            "pmid_or_doi": e.pmid_or_doi,
            "url": e.url,
            "pub_year": e.pub_year,
            "evidence_level": e.evidence_level,
            "summary": e.summary,
            "created_at": e.created_at.isoformat(),
        }
        for e in items
    ]
