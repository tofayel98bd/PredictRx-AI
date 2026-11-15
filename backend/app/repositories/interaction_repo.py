"""Drug-drug interaction matrix and evidence repository."""

from typing import List, Optional
from uuid import UUID
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.clinical_evidence import ClinicalEvidence
from app.models.interaction import DrugInteractionMatrix


class InteractionRepository:
    """Repository handling drug interaction matrix and clinical evidence."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, item_id: UUID) -> Optional[DrugInteractionMatrix]:
        return self.db.execute(select(DrugInteractionMatrix).where(DrugInteractionMatrix.id == item_id)).scalar_one_or_none()

    def find_interaction(self, drug_a: str, drug_b: str) -> Optional[DrugInteractionMatrix]:
        """Find interaction between two drugs regardless of order."""
        da = drug_a.lower().strip()
        db = drug_b.lower().strip()

        stmt = select(DrugInteractionMatrix).where(
            or_(
                (DrugInteractionMatrix.drug_a_generic == da) & (DrugInteractionMatrix.drug_b_generic == db),
                (DrugInteractionMatrix.drug_a_generic == db) & (DrugInteractionMatrix.drug_b_generic == da),
                # Substring matching in combinations like "amlodipine + olmesartan"
                DrugInteractionMatrix.drug_a_generic.ilike(f"%{da}%") & DrugInteractionMatrix.drug_b_generic.ilike(f"%{db}%"),
                DrugInteractionMatrix.drug_a_generic.ilike(f"%{db}%") & DrugInteractionMatrix.drug_b_generic.ilike(f"%{da}%"),
            )
        ).limit(1)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_interactions(
        self,
        search: Optional[str] = None,
        severity: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[DrugInteractionMatrix]:
        stmt = select(DrugInteractionMatrix)
        if search and search.strip():
            query = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    DrugInteractionMatrix.drug_a_generic.ilike(query),
                    DrugInteractionMatrix.drug_b_generic.ilike(query),
                    DrugInteractionMatrix.clinical_effect.ilike(query),
                    DrugInteractionMatrix.mechanism.ilike(query),
                )
            )
        if severity and severity.upper() != "ALL":
            stmt = stmt.where(DrugInteractionMatrix.severity.ilike(severity.strip()))

        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def list_evidence(
        self,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ClinicalEvidence]:
        stmt = select(ClinicalEvidence)
        if search and search.strip():
            query = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    ClinicalEvidence.title.ilike(query),
                    ClinicalEvidence.authors.ilike(query),
                    ClinicalEvidence.journal_or_source.ilike(query),
                    ClinicalEvidence.summary.ilike(query),
                )
            )
        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def count(self) -> int:
        return self.db.scalar(select(func.count(DrugInteractionMatrix.id))) or 0
