"""Drug interaction evaluation service with Triple Whammy detection."""

from typing import List, Set, Tuple
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.interaction import DrugInteractionMatrix
from app.repositories.interaction_repo import InteractionRepository
from app.schemas.analysis import DrugInteractionSchema

logger = get_logger("app.services.interaction")

# Classification sets for Triple Whammy identification
ACE_ARB_GENERICS = {
    "ramipril", "enalapril", "lisinopril", "losartan", "olmesartan",
    "amlodipine + olmesartan", "telmisartan", "valsartan", "candesartan",
}
DIURETIC_GENERICS = {
    "furosemide", "hydrochlorothiazide", "indapamide", "spironolactone", "torsemide",
}
NSAID_GENERICS = {
    "ketorolac", "ketorolac tromethamine", "ibuprofen", "naproxen",
    "diclofenac", "indomethacin", "meloxicam", "piroxicam", "aceclofenac",
}


class InteractionService:
    """Service to evaluate drug interactions and complex polypharmacy risks."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = InteractionRepository(db)

    def evaluate_interactions(self, generics: List[str]) -> List[DrugInteractionSchema]:
        """Evaluate all pairwise combinations and specific multi-drug syndromes."""
        clean_generics = [g.strip().lower() for g in generics if g and g.strip()]
        unique_generics = list(dict.fromkeys(clean_generics))
        results: List[DrugInteractionSchema] = []
        seen_pairs: Set[Tuple[str, str]] = set()

        # 1. Pairwise database check
        for i in range(len(unique_generics)):
            for j in range(i + 1, len(unique_generics)):
                g1 = unique_generics[i]
                g2 = unique_generics[j]
                pair_key = tuple(sorted([g1, g2]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                match = self.repo.find_interaction(g1, g2)
                if match:
                    results.append(
                        DrugInteractionSchema(
                            id=str(match.id),
                            drug_a=g1.title(),
                            drug_b=g2.title(),
                            severity=match.severity.upper(),
                            mechanism=match.mechanism,
                            clinical_significance=match.clinical_effect,
                            evidence_source=f"PredictRx Matrix ({match.evidence_level})",
                            recommended_action=match.management_recommendation,
                            management_protocol="Clinical Review Required",
                        )
                    )

        # 2. Multi-drug check: "Triple Whammy" (ACEi/ARB + Diuretic + NSAID)
        has_ace_arb = any(any(a in g for a in ACE_ARB_GENERICS) for g in unique_generics)
        has_diuretic = any(any(d in g for d in DIURETIC_GENERICS) for g in unique_generics)
        has_nsaid = any(any(n in g for n in NSAID_GENERICS) for g in unique_generics)

        if has_ace_arb and has_diuretic and has_nsaid:
            # Check if already added
            triple_whammy_exists = any("triple whammy" in i.clinical_significance.lower() for i in results)
            if not triple_whammy_exists:
                results.insert(
                    0,
                    DrugInteractionSchema(
                        id="TRIPLE-WHAMMY-SYNDROME",
                        drug_a="ACEi / ARB + Diuretic",
                        drug_b="Systemic NSAID",
                        severity="CRITICAL",
                        mechanism="Triple Whammy: Simultaneous efferent arteriolar vasodilation (ACEi/ARB), afferent arteriolar vasoconstriction (NSAID), and intravascular volume depletion (Diuretic) causing severe loss of renal autoregulation.",
                        clinical_significance="Drastic 31% to 80% increased risk of Acute Kidney Injury (AKI) requiring hospitalization and potential emergency hemodialysis.",
                        evidence_source="CMAJ 2013 Cohort / KDIGO 2024 Practice Guidelines",
                        recommended_action="Immediately replace NSAID with Paracetamol (Napa/Ace up to 3g/day) or topical analgesic. Re-check renal function within 48-72 hours.",
                        management_protocol="Urgent Clinician Intervention Required",
                    ),
                )

        return results
