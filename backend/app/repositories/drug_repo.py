"""Bangladesh DGDA drug catalog repository."""

from typing import List, Optional
from uuid import UUID
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.drug import BDDrugCatalog


class DrugRepository:
    """Repository handling Bangladesh drug catalog lookup and fuzzy search."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, drug_id: UUID) -> Optional[BDDrugCatalog]:
        return self.db.execute(select(BDDrugCatalog).where(BDDrugCatalog.id == drug_id)).scalar_one_or_none()

    def find_by_brand_exact(self, brand: str) -> Optional[BDDrugCatalog]:
        return self.db.execute(
            select(BDDrugCatalog)
            .where(BDDrugCatalog.brand_name.ilike(brand.strip()))
            .limit(1)
        ).scalar_one_or_none()

    def find_by_brand_prefix_or_contains(self, brand: str) -> List[BDDrugCatalog]:
        term = brand.strip().lower()
        stmt = (
            select(BDDrugCatalog)
            .where(
                or_(
                    BDDrugCatalog.brand_name.ilike(f"{term}%"),
                    BDDrugCatalog.brand_name.ilike(f"%{term}%"),
                    BDDrugCatalog.generic_name.ilike(f"%{term}%"),
                )
            )
            .limit(10)
        )
        return list(self.db.execute(stmt).scalars().all())

    def list(
        self,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[BDDrugCatalog]:
        stmt = select(BDDrugCatalog)
        if search and search.strip():
            query = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    BDDrugCatalog.brand_name.ilike(query),
                    BDDrugCatalog.generic_name.ilike(query),
                    BDDrugCatalog.manufacturer.ilike(query),
                    BDDrugCatalog.therapeutic_class.ilike(query),
                )
            )
        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def count(self) -> int:
        from sqlalchemy import func
        return self.db.scalar(select(func.count(BDDrugCatalog.id))) or 0
