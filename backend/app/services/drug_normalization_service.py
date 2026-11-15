"""Bangladesh brand-to-generic normalization service."""

import re
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.drug import BDDrugCatalog
from app.repositories.drug_repo import DrugRepository
from app.schemas.drug import DrugNormalizationResult

logger = get_logger("app.services.drug_normalization")

# Fallback seed of major Bangladesh brands if not found in catalog
BRAND_SEED: dict[str, str] = {
    "napa": "Paracetamol",
    "napa extend": "Paracetamol",
    "ace": "Paracetamol",
    "sergel": "Esomeprazole",
    "maxpro": "Esomeprazole",
    "seclo": "Omeprazole",
    "losectil": "Omeprazole",
    "ecospirin": "Aspirin",
    "rolac": "Ketorolac Tromethamine",
    "torax": "Ketorolac Tromethamine",
    "bizoran": "Amlodipine + Olmesartan",
    "camlosart": "Amlodipine + Olmesartan",
    "fexo": "Fexofenadine",
    "monas": "Montelukast",
    "zimax": "Azithromycin",
    "ciprocin": "Ciprofloxacin",
    "filmet": "Metronidazole",
    "lasix": "Furosemide",
    "ramiril": "Ramipril",
}


class DrugNormalizationService:
    """Service to normalize extracted brand names to generic names and DGDA catalog entries."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = DrugRepository(db)

    def normalize(self, brand_input: str) -> DrugNormalizationResult:
        """
        Normalize a brand or raw medicine token into a catalog generic entry.
        Example: "Tab. Napa Extend 665mg" -> Generic: "Paracetamol", Catalog: Napa Extend 665mg
        """
        raw = brand_input.strip()
        cleaned = self._clean_token(raw)

        # 1. Exact match in database catalog
        exact_match = self.repo.find_by_brand_exact(cleaned)
        if exact_match:
            return DrugNormalizationResult(
                brand_name=exact_match.brand_name,
                generic_name=exact_match.generic_name,
                catalog_id=exact_match.id,
                dosage_form=exact_match.dosage_form,
                strength=exact_match.strength,
                manufacturer=exact_match.manufacturer,
                therapeutic_class=exact_match.therapeutic_class,
                max_daily_dose_mg=exact_match.max_daily_dose_mg,
                is_matched=True,
                confidence=0.98,
                normalized_source="database_exact",
            )

        # 2. Substring/prefix search in database catalog
        candidates = self.repo.find_by_brand_prefix_or_contains(cleaned)
        if candidates:
            best = candidates[0]
            return DrugNormalizationResult(
                brand_name=best.brand_name,
                generic_name=best.generic_name,
                catalog_id=best.id,
                dosage_form=best.dosage_form,
                strength=best.strength,
                manufacturer=best.manufacturer,
                therapeutic_class=best.therapeutic_class,
                max_daily_dose_mg=best.max_daily_dose_mg,
                is_matched=True,
                confidence=0.85,
                normalized_source="database_fuzzy",
            )

        # 3. Fallback brand seed dictionary check
        for seed_brand, seed_generic in BRAND_SEED.items():
            if seed_brand in cleaned.lower():
                return DrugNormalizationResult(
                    brand_name=seed_brand.title(),
                    generic_name=seed_generic,
                    is_matched=True,
                    confidence=0.80,
                    normalized_source="seed_fallback",
                )

        # 4. Unmatched fallback
        return DrugNormalizationResult(
            brand_name=raw,
            generic_name=None,
            is_matched=False,
            confidence=0.30,
            normalized_source="raw_unmatched",
        )

    def _clean_token(self, text: str) -> str:
        """Strip prefixes like 'Tab.', 'Cap.', 'Syr.', and trailing strengths."""
        t = re.sub(r"^(tab|tablet|cap|capsule|syr|syrup|inj|injection)\.?\s*", "", text, flags=re.IGNORECASE)
        t = re.sub(r"\s+\d+\s*(mg|g|ml|mcg).*$", "", t, flags=re.IGNORECASE)
        return t.strip()
