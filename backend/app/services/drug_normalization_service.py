"""Bangladesh brand-to-generic normalization service with Fuzzy Matching (difflib)."""

import difflib
import re
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.drug import BDDrugCatalog
from app.repositories.drug_repo import DrugRepository
from app.schemas.drug import DrugNormalizationResult

logger = get_logger("app.services.drug_normalization")

# Fallback seed of major Bangladesh brands if not found in catalog
BRAND_SEED: Dict[str, str] = {
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
    "comformin": "Metformin",
    "trajenta": "Linagliptin",
    "jardiance": "Empagliflozin",
    "dextrose": "Dextrose",
    "ors": "Oral Rehydration Salts",
    "oral rehydration": "Oral Rehydration Salts",
}


class DrugNormalizationService:
    """
    Service to normalize extracted brand names to generic names and DGDA catalog entries.
    Features exact database matching, prefix matching, difflib fuzzy matching
    for misspelled or OCR-corrupted brands, and generic fallback resolution.
    """

    _catalog_cache: Optional[List[BDDrugCatalog]] = None
    _brand_map: Optional[Dict[str, BDDrugCatalog]] = None
    _brand_names: Optional[List[str]] = None
    _generic_names: Optional[List[str]] = None

    def __init__(self, db: Session):
        self.db = db
        self.repo = DrugRepository(db)
        self._ensure_cache()

    def _ensure_cache(self) -> None:
        """Cache all active catalog entries in memory for sub-millisecond fuzzy lookups."""
        if DrugNormalizationService._catalog_cache is None:
            entries = self.repo.get_all_catalog_entries()
            DrugNormalizationService._catalog_cache = entries
            # Map lowercase brand name to catalog entry
            b_map: Dict[str, BDDrugCatalog] = {}
            b_names: List[str] = []
            g_names: set[str] = set()
            for e in entries:
                key = e.brand_name.strip().lower()
                b_map[key] = e
                b_names.append(e.brand_name.strip())
                g_names.add(e.generic_name.strip())

            # Also index BRAND_SEED brands into brand names
            for b in BRAND_SEED.keys():
                if b not in b_map:
                    b_names.append(b.title())

            DrugNormalizationService._brand_map = b_map
            DrugNormalizationService._brand_names = sorted(list(set(b_names)))
            DrugNormalizationService._generic_names = sorted(list(g_names))

    @classmethod
    def invalidate_cache(cls) -> None:
        """Clear cache if catalog updates."""
        cls._catalog_cache = None
        cls._brand_map = None
        cls._brand_names = None
        cls._generic_names = None

    def normalize(self, brand_input: str) -> DrugNormalizationResult:
        """
        Normalize a brand or raw medicine token into a catalog generic entry.
        Example: "Tab. Sergil 20mg" -> Generic: "Esomeprazole", Catalog: Sergel 20 mg
        """
        raw = brand_input.strip()
        cleaned = self._clean_token(raw)
        cleaned_lower = cleaned.lower()

        # 1. Exact match in database catalog
        exact_match = self.repo.find_by_brand_exact(cleaned)
        if exact_match:
            return self._build_result(exact_match, confidence=0.98, source="database_exact")

        # 2. Exact match in curated brand seed dictionary (prevents short tokens like 'ORS' matching 'Torsemide')
        if cleaned_lower in BRAND_SEED:
            seed_generic = BRAND_SEED[cleaned_lower]
            return DrugNormalizationResult(
                brand_name=cleaned.upper() if len(cleaned) <= 3 else cleaned.title(),
                generic_name=seed_generic,
                is_matched=True,
                confidence=0.95,
                normalized_source="seed_exact",
            )

        # 3. Substring/prefix search in database catalog (only for tokens >= 4 characters to avoid false positive substring matches)
        candidates = self.repo.find_by_brand_prefix_or_contains(cleaned) if len(cleaned) >= 4 else []
        if candidates:
            # Check if one of candidates matches case-insensitively
            for c in candidates:
                if c.brand_name.lower() == cleaned_lower:
                    return self._build_result(c, confidence=0.98, source="database_exact")
            best = candidates[0]
            return self._build_result(best, confidence=0.90, source="database_prefix")

        # 3. Fuzzy Brand Match via difflib.get_close_matches (Cutoff 0.65)
        # Handles OCR and handwriting errors: Sergil -> Sergel, Bizorun -> Bizoran, Rolaq -> Rolac
        if self._brand_names:
            matches = difflib.get_close_matches(cleaned, self._brand_names, n=1, cutoff=0.65)
            if not matches:
                # Try lower-cased matching
                lower_matches = difflib.get_close_matches(
                    cleaned_lower,
                    [b.lower() for b in self._brand_names],
                    n=1,
                    cutoff=0.65,
                )
                if lower_matches:
                    target_lower = lower_matches[0]
                    for b in self._brand_names:
                        if b.lower() == target_lower:
                            matches = [b]
                            break

            if matches:
                matched_brand = matches[0]
                ratio = difflib.SequenceMatcher(None, cleaned_lower, matched_brand.lower()).ratio()
                matched_entry = self._brand_map.get(matched_brand.lower()) if self._brand_map else None

                if matched_entry:
                    logger.info(f"Fuzzy matched '{raw}' -> '{matched_brand}' (ratio: {ratio:.2f})")
                    return self._build_result(
                        matched_entry,
                        confidence=round(ratio * 0.95, 2),
                        source="fuzzy_matched",
                    )
                elif matched_brand.lower() in BRAND_SEED:
                    seed_generic = BRAND_SEED[matched_brand.lower()]
                    return DrugNormalizationResult(
                        brand_name=matched_brand.title(),
                        generic_name=seed_generic,
                        is_matched=True,
                        confidence=round(ratio * 0.90, 2),
                        normalized_source="fuzzy_seed_matched",
                    )

        # 4. Fallback: Fuzzy Generic Match (in case prescription wrote generic with typo)
        if self._generic_names:
            gen_matches = difflib.get_close_matches(cleaned_lower, [g.lower() for g in self._generic_names], n=1, cutoff=0.70)
            if gen_matches:
                matched_gen_lower = gen_matches[0]
                ratio = difflib.SequenceMatcher(None, cleaned_lower, matched_gen_lower).ratio()
                canonical_generic = next((g for g in self._generic_names if g.lower() == matched_gen_lower), matched_gen_lower.title())
                sample_entry = next((e for e in (self._catalog_cache or []) if e.generic_name.lower() == matched_gen_lower), None)
                if sample_entry:
                    return DrugNormalizationResult(
                        brand_name=sample_entry.brand_name,
                        generic_name=sample_entry.generic_name,
                        catalog_id=sample_entry.id,
                        dosage_form=sample_entry.dosage_form,
                        strength=sample_entry.strength,
                        manufacturer=sample_entry.manufacturer,
                        therapeutic_class=sample_entry.therapeutic_class,
                        max_daily_dose_mg=sample_entry.max_daily_dose_mg,
                        is_matched=True,
                        confidence=round(ratio * 0.92, 2),
                        normalized_source="generic_fuzzy",
                    )

        # 5. Fallback brand seed dictionary check
        for seed_brand, seed_generic in BRAND_SEED.items():
            if seed_brand in cleaned_lower:
                return DrugNormalizationResult(
                    brand_name=seed_brand.title(),
                    generic_name=seed_generic,
                    is_matched=True,
                    confidence=0.80,
                    normalized_source="seed_fallback",
                )

        # 6. Unmatched fallback
        return DrugNormalizationResult(
            brand_name=raw,
            generic_name=None,
            is_matched=False,
            confidence=0.30,
            normalized_source="raw_unmatched",
        )

    def _build_result(self, entry: BDDrugCatalog, confidence: float, source: str) -> DrugNormalizationResult:
        """Helper to build DrugNormalizationResult from catalog entry."""
        return DrugNormalizationResult(
            brand_name=entry.brand_name,
            generic_name=entry.generic_name,
            catalog_id=entry.id,
            dosage_form=entry.dosage_form,
            strength=entry.strength,
            manufacturer=entry.manufacturer,
            therapeutic_class=entry.therapeutic_class,
            max_daily_dose_mg=entry.max_daily_dose_mg,
            is_matched=True,
            confidence=confidence,
            normalized_source=source,
        )

    def _clean_token(self, text: str) -> str:
        """Strip prefixes like 'Tab.', 'Cap.', 'Syr.', and trailing strengths / dosages."""
        t = re.sub(r"^(tab|tablet|cap|capsule|syr|syrup|inj|injection)\.?\s*", "", text, flags=re.IGNORECASE)
        t = re.sub(r"\s+\d+([/.]\d+)?(\s*(mg|g|ml|mcg|iu|%))?.*$", "", t, flags=re.IGNORECASE)
        return t.strip()
