"""Drug interaction evaluation service with Triple Whammy and Deterministic Clinical Guardrails."""

from typing import List, Optional, Set, Tuple
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.repositories.interaction_repo import InteractionRepository
from app.schemas.analysis import DrugInteractionSchema

logger = get_logger("app.services.interaction")

# Pharmacological Classification Sets
ACE_ARB_GENERICS = {
    "ramipril", "enalapril", "lisinopril", "losartan", "olmesartan",
    "amlodipine + olmesartan", "telmisartan", "valsartan", "candesartan", "captopril", "perindopril",
}
POTASSIUM_GENERICS = {
    "potassium", "potassium chloride", "potassium supplement", "potassium supplements",
    "ultra-k", "k-supplement", "spironolactone", "eplerenone", "amiloride", "triamterene",
}
DIURETIC_GENERICS = {
    "furosemide", "hydrochlorothiazide", "indapamide", "spironolactone", "torsemide", "chlorthalidone",
}
NSAID_GENERICS = {
    "ketorolac", "ketorolac tromethamine", "ibuprofen", "naproxen",
    "diclofenac", "indomethacin", "meloxicam", "piroxicam", "aceclofenac", "mefenamic acid",
}
ANTICOAGULANT_GENERICS = {
    "warfarin", "heparin", "enoxaparin", "rivaroxaban", "apixaban", "dabigatran",
}
ANTIPLATELET_GENERICS = {
    "aspirin", "clopidogrel", "ticagrelor", "prasugrel",
}
BETA_BLOCKER_GENERICS = {
    "atenolol", "metoprolol", "bisoprolol", "carvedilol", "nebivolol", "propranolol", "labetalol",
}
NON_DHP_CCB_GENERICS = {
    "verapamil", "diltiazem",
}
MACROLIDE_GENERICS = {
    "clarithromycin", "erythromycin", "azithromycin",
}
STATIN_GENERICS = {
    "simvastatin", "atorvastatin", "lovastatin", "rosuvastatin",
}
SEROTONERGIC_GENERICS = {
    "fluoxetine", "sertraline", "escitalopram", "citalopram", "paroxetine", "venlafaxine", "duloxetine",
}
TRAMADOL_GENERICS = {
    "tramadol", "linezolid", "selegiline",
}
FLUOROQUINOLONE_GENERICS = {
    "ciprofloxacin", "levofloxacin", "moxifloxacin", "ofloxacin",
}
THEOPHYLLINE_GENERICS = {
    "theophylline", "aminophylline",
}
METHOTREXATE_GENERICS = {
    "methotrexate",
}
DIGOXIN_GENERICS = {
    "digoxin",
}


def _matches(generic: str, target_set: Set[str]) -> bool:
    g = generic.lower().strip()
    return any(t in g or g in t for t in target_set)


class InteractionService:
    """Service to evaluate drug interactions, complex polypharmacy, and deterministic safety guardrails."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = InteractionRepository(db)

    def evaluate_interactions(self, generics: List[str]) -> List[DrugInteractionSchema]:
        """Evaluate all pairwise combinations, class-level guardrails, and multi-drug syndromes."""
        clean_generics = [g.strip().lower() for g in generics if g and g.strip()]
        unique_generics = list(dict.fromkeys(clean_generics))
        results: List[DrugInteractionSchema] = []
        seen_pairs: Set[Tuple[str, str]] = set()

        # 1. Pairwise database check + deterministic fallback guardrails
        for i in range(len(unique_generics)):
            for j in range(i + 1, len(unique_generics)):
                g1 = unique_generics[i]
                g2 = unique_generics[j]
                pair_key = tuple(sorted([g1, g2]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                # Try database match
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
                else:
                    # Deterministic Guardrail Check (Prevents false negatives if pair was unseeded)
                    guardrail = self._evaluate_guardrail_pair(g1, g2)
                    if guardrail:
                        results.append(guardrail)

        # 2. Multi-drug check: "Triple Whammy" (ACEi/ARB + Diuretic + NSAID)
        has_ace_arb = any(_matches(g, ACE_ARB_GENERICS) for g in unique_generics)
        has_diuretic = any(_matches(g, DIURETIC_GENERICS) for g in unique_generics)
        has_nsaid = any(_matches(g, NSAID_GENERICS) for g in unique_generics)

        if has_ace_arb and has_diuretic and has_nsaid:
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

    def _evaluate_guardrail_pair(self, g1: str, g2: str) -> Optional[DrugInteractionSchema]:
        """Class-based deterministic guardrail rules."""
        # A. ACEi/ARB + Potassium / K-sparing diuretics (CRITICAL)
        if (_matches(g1, ACE_ARB_GENERICS) and _matches(g2, POTASSIUM_GENERICS)) or \
           (_matches(g2, ACE_ARB_GENERICS) and _matches(g1, POTASSIUM_GENERICS)):
            return DrugInteractionSchema(
                id=f"GUARD-ACE-POTASSIUM-{abs(hash(g1+g2)) % 10000}",
                drug_a=g1.title(),
                drug_b=g2.title(),
                severity="CRITICAL",
                mechanism="ACE inhibitors/ARBs inhibit aldosterone synthesis, impairing distal renal potassium excretion. Co-administration of potassium supplements or potassium-sparing diuretics produces life-threatening potassium retention.",
                clinical_significance="Severe Hyperkalemia (serum K+ > 5.5-6.0 mmol/L) with severe risk of fatal cardiac conduction block, ventricular arrhythmias, and cardiac arrest.",
                evidence_source="AHA/ACC Heart Failure & Hypertension Guidelines / BNF 86",
                recommended_action="Avoid concomitant potassium supplements with ACE inhibitors/ARBs. Discontinue routine potassium supplementation. Monitor serum electrolytes and ECG immediately.",
                management_protocol="Emergency Electrolyte & ECG Monitoring",
            )

        # B. Anticoagulant + NSAID / Antiplatelet (CRITICAL)
        if (_matches(g1, ANTICOAGULANT_GENERICS) and (_matches(g2, NSAID_GENERICS) or _matches(g2, ANTIPLATELET_GENERICS))) or \
           (_matches(g2, ANTICOAGULANT_GENERICS) and (_matches(g1, NSAID_GENERICS) or _matches(g1, ANTIPLATELET_GENERICS))):
            return DrugInteractionSchema(
                id=f"GUARD-ANTICOAG-BLEED-{abs(hash(g1+g2)) % 10000}",
                drug_a=g1.title(),
                drug_b=g2.title(),
                severity="CRITICAL",
                mechanism="Synergistic inhibition of clotting factor synthesis/thrombin and platelet aggregation, coupled with direct NSAID-induced gastric mucosal injury.",
                clinical_significance="Catastrophic gastrointestinal hemorrhage and life-threatening systemic bleeding complications.",
                evidence_source="CHEST Guidelines on Antithrombotic Therapy / BNF 86",
                recommended_action="Strictly avoid systemic NSAIDs with anticoagulants. Substitute with Paracetamol or topical therapy. Require PPI gastroprotection if antiplatelet co-prescribed.",
                management_protocol="Urgent Hemostatic Review Required",
            )

        # C. Beta-blocker + Non-DHP CCB (Verapamil / Diltiazem) (CRITICAL)
        if (_matches(g1, BETA_BLOCKER_GENERICS) and _matches(g2, NON_DHP_CCB_GENERICS)) or \
           (_matches(g2, BETA_BLOCKER_GENERICS) and _matches(g1, NON_DHP_CCB_GENERICS)):
            return DrugInteractionSchema(
                id=f"GUARD-BB-CCB-{abs(hash(g1+g2)) % 10000}",
                drug_a=g1.title(),
                drug_b=g2.title(),
                severity="CRITICAL",
                mechanism="Additive negative inotropic, chronotropic, and dromotropic cardiac suppression at the sinoatrial and atrioventricular nodes.",
                clinical_significance="Severe bradycardia, complete heart block, acute cardiogenic shock, and left ventricular failure.",
                evidence_source="ACC/AHA Guidelines / BNF 86",
                recommended_action="Avoid concurrent oral administration in outpatient practice. Discontinue one agent and perform continuous ECG rhythm monitoring.",
                management_protocol="Cardiac Rhythm Monitoring Required",
            )

        # D. Methotrexate + NSAID (CRITICAL)
        if (_matches(g1, METHOTREXATE_GENERICS) and _matches(g2, NSAID_GENERICS)) or \
           (_matches(g2, METHOTREXATE_GENERICS) and _matches(g1, NSAID_GENERICS)):
            return DrugInteractionSchema(
                id=f"GUARD-MTX-NSAID-{abs(hash(g1+g2)) % 10000}",
                drug_a=g1.title(),
                drug_b=g2.title(),
                severity="CRITICAL",
                mechanism="NSAIDs diminish renal blood flow and competitively inhibit active renal tubular secretion of methotrexate.",
                clinical_significance="Methotrexate toxic accumulation, profound bone marrow suppression, severe pancytopenia, and fatal acute kidney injury.",
                evidence_source="FDA Black Box Warning / EULAR Rheumatology Guidelines",
                recommended_action="Avoid NSAIDs in patients taking anti-neoplastic or high-dose methotrexate. Monitor complete blood count and renal profile.",
                management_protocol="Emergency Hematologic Vigilance",
            )

        # E. SSRI/SNRI + Tramadol (CRITICAL - Serotonin Syndrome)
        if (_matches(g1, SEROTONERGIC_GENERICS) and _matches(g2, TRAMADOL_GENERICS)) or \
           (_matches(g2, SEROTONERGIC_GENERICS) and _matches(g1, TRAMADOL_GENERICS)):
            return DrugInteractionSchema(
                id=f"GUARD-SEROTONIN-SYNDROME-{abs(hash(g1+g2)) % 10000}",
                drug_a=g1.title(),
                drug_b=g2.title(),
                severity="CRITICAL",
                mechanism="Additive synaptic serotonin excess via concurrent reuptake inhibition and stimulated serotonin release.",
                clinical_significance="Serotonin Syndrome: neuromuscular hyperexcitability, hyperthermia, autonomic delirium, and potential fatality.",
                evidence_source="Hunter Serotonin Toxicity Criteria / BNF 86",
                recommended_action="Avoid concomitant use. Discontinue tramadol; substitute with a non-serotonergic analgesic (e.g. Paracetamol).",
                management_protocol="Neurological & Autonomic Assessment",
            )

        # F. Digoxin + Verapamil / Amiodarone / Macrolide (CRITICAL)
        if (_matches(g1, DIGOXIN_GENERICS) and (_matches(g2, NON_DHP_CCB_GENERICS) or _matches(g2, MACROLIDE_GENERICS) or "amiodarone" in g2)) or \
           (_matches(g2, DIGOXIN_GENERICS) and (_matches(g1, NON_DHP_CCB_GENERICS) or _matches(g1, MACROLIDE_GENERICS) or "amiodarone" in g1)):
            return DrugInteractionSchema(
                id=f"GUARD-DIGOXIN-TOXICITY-{abs(hash(g1+g2)) % 10000}",
                drug_a=g1.title(),
                drug_b=g2.title(),
                severity="CRITICAL",
                mechanism="P-glycoprotein efflux pump inhibition sharply elevates serum digoxin concentrations by 60-100%.",
                clinical_significance="Digoxin toxicity: lethal ventricular arrhythmias, severe AV nodal block, and systemic digitalis toxicity.",
                evidence_source="AHA/ESC Heart Failure Guidelines / BNF 86",
                recommended_action="Reduce digoxin maintenance dose by 50% immediately upon co-prescription. Perform therapeutic drug monitoring (TDM).",
                management_protocol="Serum Digoxin Level & ECG Monitoring",
            )

        # G. Statin (Simvastatin/Atorvastatin) + Macrolide (HIGH - Rhabdomyolysis)
        if (_matches(g1, STATIN_GENERICS) and _matches(g2, MACROLIDE_GENERICS)) or \
           (_matches(g2, STATIN_GENERICS) and _matches(g1, MACROLIDE_GENERICS)):
            return DrugInteractionSchema(
                id=f"GUARD-STATIN-RHABDO-{abs(hash(g1+g2)) % 10000}",
                drug_a=g1.title(),
                drug_b=g2.title(),
                severity="HIGH",
                mechanism="Potent CYP3A4 inhibition increases statin AUC up to 10-fold, triggering acute myocyte lysis.",
                clinical_significance="Rhabdomyolysis, severe myopathy, myoglobinuria, and acute secondary renal failure.",
                evidence_source="FDA Drug Safety Communication / BNF 86",
                recommended_action="Temporarily suspend simvastatin/atorvastatin during macrolide antibiotic therapy, or switch antibiotic to azithromycin.",
                management_protocol="Serum Creatine Kinase (CK) Monitoring",
            )

        # H. Fluoroquinolone + Theophylline (HIGH)
        if (_matches(g1, FLUOROQUINOLONE_GENERICS) and _matches(g2, THEOPHYLLINE_GENERICS)) or \
           (_matches(g2, FLUOROQUINOLONE_GENERICS) and _matches(g1, THEOPHYLLINE_GENERICS)):
            return DrugInteractionSchema(
                id=f"GUARD-CIPRO-THEO-{abs(hash(g1+g2)) % 10000}",
                drug_a=g1.title(),
                drug_b=g2.title(),
                severity="HIGH",
                mechanism="Fluoroquinolone inhibition of CYP1A2 markedly blocks the hepatic clearance of theophylline.",
                clinical_significance="Theophylline toxicity: tachyarrhythmias, hypokalemia, neuromuscular tremors, and intractable seizures.",
                evidence_source="Micromedex / DGDA Drug Safety Alerts",
                recommended_action="Reduce theophylline dose by 50% or choose an alternative non-interacting antibiotic (e.g. Azithromycin).",
                management_protocol="Serum Theophylline Level Monitoring",
            )

        # I. Clopidogrel + Omeprazole / Esomeprazole (HIGH)
        if ("clopidogrel" in g1 and any(p in g2 for p in ("omeprazole", "esomeprazole"))) or \
           ("clopidogrel" in g2 and any(p in g1 for p in ("omeprazole", "esomeprazole"))):
            return DrugInteractionSchema(
                id=f"GUARD-CLOPID-PPI-{abs(hash(g1+g2)) % 10000}",
                drug_a=g1.title(),
                drug_b=g2.title(),
                severity="HIGH",
                mechanism="Competitive inhibition of CYP2C19 bioactivation reduces circulating active clopidogrel thiol metabolite.",
                clinical_significance="Attenuated antiplatelet protection, increased risk of stent thrombosis and recurrent myocardial infarction.",
                evidence_source="FDA Safety Advisory / ACCP Practice Guidelines",
                recommended_action="Substitute omeprazole/esomeprazole with pantoprazole or famotidine, which lack significant CYP2C19 interaction.",
                management_protocol="Substitute with Pantoprazole",
            )

        return None
