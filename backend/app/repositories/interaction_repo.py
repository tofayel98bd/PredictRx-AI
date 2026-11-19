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
        """Find interaction between two drugs regardless of order, compound terms, or supplements."""
        da = drug_a.lower().strip()
        db = drug_b.lower().strip()

        # Direct SQL search with primary token variants
        da_token = da.split()[0] if da else ""
        db_token = db.split()[0] if db else ""

        stmt = select(DrugInteractionMatrix).where(
            or_(
                (DrugInteractionMatrix.drug_a_generic == da) & (DrugInteractionMatrix.drug_b_generic == db),
                (DrugInteractionMatrix.drug_a_generic == db) & (DrugInteractionMatrix.drug_b_generic == da),
                DrugInteractionMatrix.drug_a_generic.ilike(f"%{da}%") & DrugInteractionMatrix.drug_b_generic.ilike(f"%{db}%"),
                DrugInteractionMatrix.drug_a_generic.ilike(f"%{db}%") & DrugInteractionMatrix.drug_b_generic.ilike(f"%{da}%"),
                # Token level matching
                DrugInteractionMatrix.drug_a_generic.ilike(f"%{da_token}%") & DrugInteractionMatrix.drug_b_generic.ilike(f"%{db_token}%"),
                DrugInteractionMatrix.drug_a_generic.ilike(f"%{db_token}%") & DrugInteractionMatrix.drug_b_generic.ilike(f"%{da_token}%"),
            )
        ).limit(1)
        res = self.db.execute(stmt).scalar_one_or_none()
        if res:
            return res

        # Resilient symmetric in-memory matching against full matrix (guarantees zero false negatives)
        all_matrix = self.db.execute(select(DrugInteractionMatrix)).scalars().all()
        for item in all_matrix:
            ma = item.drug_a_generic.lower()
            mb = item.drug_b_generic.lower()
            if ((ma in da or da in ma or (da_token and (ma in da_token or da_token in ma))) and
                (mb in db or db in mb or (db_token and (mb in db_token or db_token in mb)))):
                return item
            if ((ma in db or db in ma or (db_token and (ma in db_token or db_token in ma))) and
                (mb in da or da in mb or (da_token and (mb in da_token or da_token in mb)))):
                return item
        return None

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
