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

# Curated high-precision generic registry to prevent false fuzzy collisions
CANONICAL_GENERICS: Dict[str, str] = {
    "paracetamol": "Paracetamol",
    "acetaminophen": "Paracetamol",
    "esomeprazole": "Esomeprazole",
    "omeprazole": "Omeprazole",
    "pantoprazole": "Pantoprazole",
    "rabeprazole": "Rabeprazole",
    "aspirin": "Aspirin",
    "acetylsalicylic acid": "Aspirin",
    "ketorolac": "Ketorolac Tromethamine",
    "ketorolac tromethamine": "Ketorolac Tromethamine",
    "naproxen": "Naproxen",
    "ibuprofen": "Ibuprofen",
    "diclofenac": "Diclofenac",
    "aceclofenac": "Aceclofenac",
    "indomethacin": "Indomethacin",
    "olmesartan": "Olmesartan",
    "losartan": "Losartan",
    "valsartan": "Valsartan",
    "telmisartan": "Telmisartan",
    "candesartan": "Candesartan",
    "enalapril": "Enalapril",
    "lisinopril": "Lisinopril",
    "ramipril": "Ramipril",
    "captopril": "Captopril",
    "perindopril": "Perindopril",
    "potassium": "Potassium",
    "potassium chloride": "Potassium",
    "potassium supplement": "Potassium",
    "potassium supplements": "Potassium",
    "spironolactone": "Spironolactone",
    "furosemide": "Furosemide",
    "hydrochlorothiazide": "Hydrochlorothiazide",
    "torsemide": "Torsemide",
    "indapamide": "Indapamide",
    "metformin": "Metformin",
    "linagliptin": "Linagliptin",
    "empagliflozin": "Empagliflozin",
    "dapagliflozin": "Dapagliflozin",
    "glimepiride": "Glimepiride",
    "gliclazide": "Gliclazide",
    "clopidogrel": "Clopidogrel",
    "warfarin": "Warfarin",
    "rivaroxaban": "Rivaroxaban",
    "apixaban": "Apixaban",
    "heparin": "Heparin",
    "atenolol": "Atenolol",
    "bisoprolol": "Bisoprolol",
    "metoprolol": "Metoprolol",
    "carvedilol": "Carvedilol",
    "nebivolol": "Nebivolol",
    "amlodipine": "Amlodipine",
    "verapamil": "Verapamil",
    "diltiazem": "Diltiazem",
    "atorvastatin": "Atorvastatin",
    "simvastatin": "Simvastatin",
    "rosuvastatin": "Rosuvastatin",
    "ciprofloxacin": "Ciprofloxacin",
    "levofloxacin": "Levofloxacin",
    "azithromycin": "Azithromycin",
    "clarithromycin": "Clarithromycin",
    "erythromycin": "Erythromycin",
    "metronidazole": "Metronidazole",
    "theophylline": "Theophylline",
    "aminophylline": "Theophylline",
    "tramadol": "Tramadol",
    "methotrexate": "Methotrexate",
    "digoxin": "Digoxin",
    "amiodarone": "Amiodarone",
    "allopurinol": "Allopurinol",
    "azathioprine": "Azathioprine",
    "escitalopram": "Escitalopram",
    "sertraline": "Sertraline",
    "fluoxetine": "Fluoxetine",
    "montelukast": "Montelukast",
    "fexofenadine": "Fexofenadine",
}

# Fallback seed of major Bangladesh brands if not found in catalog
BRAND_SEED: Dict[str, str] = {
    # Paracetamol
    "napa": "Paracetamol",
    "napa extend": "Paracetamol",
    "napa extra": "Paracetamol + Caffeine",
    "napa one": "Paracetamol",
    "ace": "Paracetamol",
    "ace plus": "Paracetamol + Caffeine",
    "fast": "Paracetamol",
    "reset": "Paracetamol",
    # PPIs
    "sergel": "Esomeprazole",
    "maxpro": "Esomeprazole",
    "seclo": "Omeprazole",
    "losectil": "Omeprazole",
    "pantodac": "Pantoprazole",
    "trupan": "Pantoprazole",
    # NSAIDs & Antiplatelets
    "ecospirin": "Aspirin",
    "aspirin cardio": "Aspirin",
    "rolac": "Ketorolac Tromethamine",
    "torax": "Ketorolac Tromethamine",
    "ketonic": "Ketorolac Tromethamine",
    "clofen": "Diclofenac",
    "voltalin": "Diclofenac",
    # Antihypertensives & Cardiovascular
    "bizoran": "Amlodipine + Olmesartan",
    "camlosart": "Amlodipine + Olmesartan",
    "ramiril": "Ramipril",
    "ramicard": "Ramipril",
    "renitec": "Enalapril",
    "vasotec": "Enalapril",
    "inopril": "Lisinopril",
    "zestril": "Lisinopril",
    "osartil": "Losartan",
    "angilock": "Losartan",
    "lasix": "Furosemide",
    "fusid": "Furosemide",
    "aldactone": "Spironolactone",
    "spirolac": "Spironolactone",
    "plagril": "Clopidogrel",
    "anclog": "Clopidogrel",
    "warf": "Warfarin",
    "lanoxin": "Digoxin",
    # Potassium supplements
    "ultra-k": "Potassium",
    "k-supplement": "Potassium",
    "potassium supplement": "Potassium",
    "potassium supplements": "Potassium",
    "k-lyte": "Potassium",
    # Statins
    "atova": "Atorvastatin",
    "lipicon": "Atorvastatin",
    # Respiratory & Antihistamines
    "fexo": "Fexofenadine",
    "fexofast": "Fexofenadine",
    "monas": "Montelukast",
    "odmon": "Montelukast",
    "theopen": "Theophylline",
    # Antimicrobials
    "zimax": "Azithromycin",
    "zithrox": "Azithromycin",
    "ciprocin": "Ciprofloxacin",
    "filmet": "Metronidazole",
    "claricin": "Clarithromycin",
    # Diabetes
    "comformin": "Metformin",
    "glucomin": "Metformin",
    "trajenta": "Linagliptin",
    "jardiance": "Empagliflozin",
    # Others
    "dextrose": "Dextrose",
    "ors": "Oral Rehydration Salts",
    "oral rehydration": "Oral Rehydration Salts",
}


class DrugNormalizationService:
    """
    Service to normalize extracted brand names to generic names and DGDA catalog entries.
    Features exact database matching, generic canonical mapping, prefix matching,
    difflib fuzzy matching with phonetic/length guardrails, and generic fallback resolution.
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
            b_map: Dict[str, BDDrugCatalog] = {}
            b_names: List[str] = []
            g_names: set[str] = set()
            for e in entries:
                key = e.brand_name.strip().lower()
                b_map[key] = e
                b_names.append(e.brand_name.strip())
                g_names.add(e.generic_name.strip())

            # Index BRAND_SEED brands into brand names
            for b in BRAND_SEED.keys():
                if b not in b_map:
                    b_names.append(b.title())

            # Index CANONICAL_GENERICS
            for g in CANONICAL_GENERICS.values():
                g_names.add(g)

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
        Example: "Potassium Supplements" -> Generic: "Potassium"
        Example: "Lisinopril 5mg" -> Generic: "Lisinopril"
        """
        raw = brand_input.strip()
        cleaned = self._clean_token(raw)
        cleaned_lower = cleaned.lower()

        # 1. Exact match in database catalog
        exact_match = self.repo.find_by_brand_exact(cleaned)
        if exact_match:
            return self._build_result(exact_match, confidence=0.98, source="database_exact")

        # 2. Curated brand seed dictionary
        if cleaned_lower in BRAND_SEED:
            seed_generic = BRAND_SEED[cleaned_lower]
            return DrugNormalizationResult(
                brand_name=cleaned.upper() if len(cleaned) <= 3 else cleaned.title(),
                generic_name=seed_generic,
                is_matched=True,
                confidence=0.96,
                normalized_source="seed_exact",
            )

        # 3. Direct Canonical Generic Matching (e.g. "Potassium Supplements" -> "Potassium", "Lisinopril" -> "Lisinopril")
        for gen_key, canonical in CANONICAL_GENERICS.items():
            if gen_key == cleaned_lower or gen_key in cleaned_lower:
                return DrugNormalizationResult(
                    brand_name=cleaned.title(),
                    generic_name=canonical,
                    is_matched=True,
                    confidence=0.95,
                    normalized_source="canonical_generic",
                )

        # 4. Token-level brand seed search (e.g. "Napa 500mg" or "Ultra-K syrup")
        for token in cleaned_lower.split():
            if token in BRAND_SEED:
                return DrugNormalizationResult(
                    brand_name=cleaned.title(),
                    generic_name=BRAND_SEED[token],
                    is_matched=True,
                    confidence=0.92,
                    normalized_source="seed_token",
                )
            if token in CANONICAL_GENERICS:
                return DrugNormalizationResult(
                    brand_name=cleaned.title(),
                    generic_name=CANONICAL_GENERICS[token],
                    is_matched=True,
                    confidence=0.92,
                    normalized_source="canonical_token",
                )

        # 5. Substring/prefix search in database catalog (for tokens >= 4 chars)
        candidates = self.repo.find_by_brand_prefix_or_contains(cleaned) if len(cleaned) >= 4 else []
        if candidates:
            for c in candidates:
                if c.brand_name.lower() == cleaned_lower:
                    return self._build_result(c, confidence=0.98, source="database_exact")
            best = candidates[0]
            return self._build_result(best, confidence=0.90, source="database_prefix")

        # 6. Guarded Fuzzy Brand Match via difflib (Cutoff 0.75, First-letter match required for length >= 5)
        # Prevents tragic cross-class collisions like 'lisinopril' -> 'bisoprolol'
        if self._brand_names:
            matches = difflib.get_close_matches(cleaned, self._brand_names, n=3, cutoff=0.72)
            filtered_matches = []
            for m in matches:
                if len(cleaned) >= 5 and m and cleaned[0].lower() != m[0].lower():
                    continue  # First letter must match to prevent class-hopping
                filtered_matches.append(m)

            if filtered_matches:
                matched_brand = filtered_matches[0]
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

        # 7. Fallback: Fuzzy Generic Match (with strict first letter check)
        if self._generic_names:
            gen_matches = difflib.get_close_matches(cleaned_lower, [g.lower() for g in self._generic_names], n=3, cutoff=0.75)
            filtered_gen = [g for g in gen_matches if (len(cleaned_lower) < 5 or g[0] == cleaned_lower[0])]
            if filtered_gen:
                matched_gen_lower = filtered_gen[0]
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
                return DrugNormalizationResult(
                    brand_name=cleaned.title(),
                    generic_name=canonical_generic,
                    is_matched=True,
                    confidence=round(ratio * 0.88, 2),
                    normalized_source="generic_fuzzy_fallback",
                )

        # 8. Unmatched fallback
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
        """Strip prefixes like 'Tab.', 'Cap.', 'Syr.', and trailing strengths / dosages / qualifiers."""
        t = re.sub(r"^(tab|tablet|cap|capsule|syr|syrup|inj|injection|drop|drops)\.?\s*", "", text, flags=re.IGNORECASE)
        t = re.sub(r"\s+\d+([/.]\d+)?(\s*(mg|g|ml|mcg|iu|%))?.*$", "", t, flags=re.IGNORECASE)
        # Strip trailing dosage schedule abbreviations like OD, BD, TDS, HS, etc.
        t = re.sub(r"\s+\b(od|bd|bid|tds|tid|qds|qid|hs|prn|sos|stat|daily|supplements|supplement)\b.*$", "", t, flags=re.IGNORECASE)
        return t.strip()
