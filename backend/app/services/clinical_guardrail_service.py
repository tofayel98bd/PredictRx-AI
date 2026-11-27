"""Deterministic Clinical Safety Guardrail Service (Allergy, Renal, Hepatic, Pregnancy, Pediatric)."""

from dataclasses import dataclass, field
import re
from typing import Any, Dict, List, Optional, Set

from app.schemas.analysis import (
    IssueSchema,
    PatientContextSchema,
    PrescriptionAlertSchema,
    SaferAlternativeSchema,
    ValidatedMedicineSchema,
)

PENICILLIN_CLASS = {"amoxicillin", "ampicillin", "flucloxacillin", "piperacillin", "penicillin"}
CEPHALOSPORIN_CLASS = {"cefixime", "cefuroxime", "ceftriaxone", "cefpodoxime", "cephalexin", "cefradine"}
SULFA_DIRECT = {"sulfamethoxazole", "cotrimoxazole", "trimethoprim + sulfamethoxazole", "sulfasalazine"}
SULFA_CROSS_CAUTION = {"furosemide", "hydrochlorothiazide", "glimepiride", "gliclazide", "celecoxib", "etoricoxib"}
NSAID_ALLERGY_CLASS = {
    "aspirin", "ketorolac", "diclofenac", "naproxen", "ibuprofen",
    "aceclofenac", "indomethacin", "meloxicam", "piroxicam", "etoricoxib", "celecoxib",
}
MACROLIDE_CLASS = {"azithromycin", "clarithromycin", "erythromycin"}

RENAL_NSAIDS = {"ketorolac", "diclofenac", "naproxen", "ibuprofen", "aceclofenac", "indomethacin", "meloxicam", "piroxicam", "etoricoxib"}
RENAL_DOSE_ADJUST = {"pregabalin", "gabapentin", "ciprofloxacin", "levofloxacin", "cefixime", "rivaroxaban", "allopurinol", "fenofibrate"}
HEPATIC_STATINS = {"atorvastatin", "rosuvastatin", "simvastatin", "lovastatin"}
PREGNANCY_TERATOGENS = {
    "ramipril", "enalapril", "lisinopril", "captopril", "perindopril",
    "losartan", "olmesartan", "telmisartan", "valsartan", "candesartan",
    "warfarin", "rivaroxaban", "apixaban", "methotrexate", "atorvastatin",
    "rosuvastatin", "simvastatin", "doxycycline", "albendazole", "ivermectin",
    "finasteride", "etoricoxib", "misoprostol", "isotretinoin",
}


def _extract_mg(strength: Optional[str]) -> Optional[float]:
    if not strength:
        return None
    m = re.search(r"(\d+(?:\.\d+)?)\s*(mg|g|mcg|µg)\b", strength.lower())
    if not m:
        return None
    val, unit = float(m.group(1)), m.group(2)
    if unit == "g":
        return val * 1000.0
    if unit in ("mcg", "µg"):
        return val / 1000.0
    return val


def _has_generic(generic: Optional[str], targets: Set[str]) -> bool:
    if not generic:
        return False
    g = generic.lower()
    return any(t in g for t in targets)


@dataclass
class GuardrailReport:
    drug_disease_conflicts: List[Dict[str, Any]] = field(default_factory=list)
    contraindications: List[Dict[str, Any]] = field(default_factory=list)
    prescription_alerts: List[PrescriptionAlertSchema] = field(default_factory=list)
    safer_alternatives: List[SaferAlternativeSchema] = field(default_factory=list)
    clinical_factors: List[str] = field(default_factory=list)
    critical_count: int = 0
    warning_count: int = 0
    top_critical_reason: Optional[str] = None


class ClinicalGuardrailService:
    """Evaluates deterministic patient-specific clinical guardrails across 5 safety domains."""

    def evaluate(
        self,
        patient: PatientContextSchema,
        medications: List[ValidatedMedicineSchema],
    ) -> GuardrailReport:
        report = GuardrailReport()
        seen_alt_generics: Set[str] = set()

        def _add_issue(
            med: ValidatedMedicineSchema,
            code: str,
            severity: str,
            message: str,
            category: str,
            is_contraindication: bool = False,
        ) -> None:
            existing = {i.code for i in med.issues}
            if code not in existing:
                med.issues.append(IssueSchema(code=code, severity=severity, message=message))
            if severity == "CRITICAL":
                med.needs_review = True
                report.critical_count += 1
                if not report.top_critical_reason:
                    report.top_critical_reason = f"{med.brand_name}: {message}"
            else:
                report.warning_count += 1

            conflict_entry = {
                "code": code,
                "category": category,
                "severity": severity,
                "drug": med.brand_name,
                "generic": med.generic_name,
                "message": message,
            }
            report.drug_disease_conflicts.append(conflict_entry)
            if is_contraindication or severity == "CRITICAL":
                report.contraindications.append(conflict_entry)

            report.prescription_alerts.append(
                PrescriptionAlertSchema(code=code, severity=severity, message=f"{med.brand_name} ({med.generic_name or 'Unknown'}): {message}")
            )

        def _add_alternative(alt: SaferAlternativeSchema) -> None:
            key = alt.original_generic.lower()
            if key not in seen_alt_generics:
                seen_alt_generics.add(key)
                report.safer_alternatives.append(alt)

        # Normalize patient context signals
        cond_text = " | ".join(c.lower() for c in patient.conditions)
        allergy_text = " | ".join(a.lower() for a in patient.allergies)
        alt_ast_text = (patient.alt_ast or "").lower()

        is_ckd_severe = (patient.egfr is not None and patient.egfr < 30) or any(
            k in cond_text for k in ("ckd stage 4", "ckd stage 5", "esrd", "dialysis")
        )
        is_ckd_mod = is_ckd_severe or (patient.egfr is not None and patient.egfr < 45) or (
            patient.creatinine is not None and patient.creatinine >= 1.8
        )
        is_hepatic = any(
            k in cond_text for k in ("cirrhosis", "hepatic", "liver failure", "hepatitis", "jaundice", "fatty liver", "nafld", "cld")
        ) or any(k in alt_ast_text for k in ("elevated", "high", "abnormal", "2x", "3x"))
        is_pregnant = (
            bool(patient.pregnancy) or "pregnan" in cond_text
        ) and (patient.gender or "").strip().lower() != "male"

        if is_hepatic:
            report.clinical_factors.append("Hepatic impairment / liver comorbidity")
        if is_pregnant:
            report.clinical_factors.append("Pregnancy / gestational safety constraints")
        if patient.allergies:
            report.clinical_factors.append(f"Documented allergies: {', '.join(patient.allergies)}")

        for med in medications:
            gen = (med.generic_name or "").strip()
            gen_lower = gen.lower()
            brand_lower = med.brand_name.lower()

            # -----------------------------------------------------------------
            # 1. ALLERGY & CROSS-REACTIVITY GUARDRAILS
            # -----------------------------------------------------------------
            if patient.allergies:
                for raw_allergy in patient.allergies:
                    al = raw_allergy.strip().lower()
                    if not al:
                        continue
                    if al in gen_lower or al in brand_lower:
                        _add_issue(
                            med,
                            "ALLERGY_DIRECT_MATCH",
                            "CRITICAL",
                            f"Direct allergy match with documented allergen '{raw_allergy}'. Contraindicated.",
                            "Allergy",
                            is_contraindication=True,
                        )

                if any(k in allergy_text for k in ("penicillin", "amoxicillin", "ampicillin", "beta-lactam")):
                    if _has_generic(gen, PENICILLIN_CLASS):
                        _add_issue(
                            med,
                            "ALLERGY_PENICILLIN_DIRECT",
                            "CRITICAL",
                            "Penicillin allergy documented: beta-lactam penicillin carries severe anaphylaxis risk.",
                            "Allergy",
                            is_contraindication=True,
                        )
                        if "azithromycin" not in allergy_text:
                            _add_alternative(
                                SaferAlternativeSchema(
                                    original_brand=med.brand_name,
                                    original_generic=gen or "Penicillin",
                                    alternative_brand="Azin 500mg / Zimax 500mg",
                                    alternative_generic="Azithromycin",
                                    clinical_rationale="Macrolide antibiotic avoids beta-lactam hypersensitivity in penicillin-allergic patients.",
                                    safety_benefit="Eliminates IgE-mediated penicillin anaphylaxis hazard.",
                                    precautions="Verify baseline QT interval if patient has cardiac arrhythmia history.",
                                    requires_clinician_approval=True,
                                )
                            )
                    elif _has_generic(gen, CEPHALOSPORIN_CLASS):
                        _add_issue(
                            med,
                            "ALLERGY_BETA_LACTAM_CROSS_REACTIVITY",
                            "WARNING",
                            "Documented Penicillin allergy: verify severity (anaphylaxis vs mild rash) due to ~1-2% cephalosporin cross-reactivity.",
                            "Allergy",
                        )

                if any(k in allergy_text for k in ("sulfa", "sulfonamide", "cotrimoxazole", "bactrim")):
                    if _has_generic(gen, SULFA_DIRECT):
                        _add_issue(
                            med,
                            "ALLERGY_SULFA_DIRECT",
                            "CRITICAL",
                            "Sulfa drug allergy documented: sulfonamide antimicrobial carries SJS/TEN and anaphylaxis risk.",
                            "Allergy",
                            is_contraindication=True,
                        )
                    elif _has_generic(gen, SULFA_CROSS_CAUTION):
                        _add_issue(
                            med,
                            "ALLERGY_SULFA_CAUTION",
                            "WARNING",
                            "Documented sulfa allergy: non-arylamine sulfonamide derivative; monitor for hypersensitivity.",
                            "Allergy",
                        )

                if any(k in allergy_text for k in ("nsaid", "aspirin", "diclofenac", "ketorolac", "ibuprofen")):
                    if _has_generic(gen, NSAID_ALLERGY_CLASS):
                        _add_issue(
                            med,
                            "ALLERGY_NSAID_CROSS_REACTIVITY",
                            "CRITICAL",
                            "NSAID/Aspirin hypersensitivity documented: COX-1 cross-reactive bronchospasm or angioedema hazard.",
                            "Allergy",
                            is_contraindication=True,
                        )
                        _add_alternative(
                            SaferAlternativeSchema(
                                original_brand=med.brand_name,
                                original_generic=gen or "NSAID",
                                alternative_brand="Napa 500mg",
                                alternative_generic="Paracetamol",
                                clinical_rationale="Paracetamol avoids COX-1 cross-reactive hypersensitivity seen across NSAID classes.",
                                safety_benefit="Prevents NSAID-exacerbated respiratory disease and anaphylactoid reactions.",
                                precautions="Keep total daily paracetamol <= 3-4 g/day.",
                                requires_clinician_approval=True,
                            )
                        )

            # -----------------------------------------------------------------
            # 2. RENAL (CKD / eGFR) GUARDRAILS
            # -----------------------------------------------------------------
            if "metformin" in gen_lower:
                if is_ckd_severe:
                    _add_issue(
                        med,
                        "RENAL_METFORMIN_CONTRAINDICATION",
                        "CRITICAL",
                        f"Metformin is CONTRAINDICATED in severe CKD (eGFR {patient.egfr or '<30'} mL/min) due to fatal lactic acidosis risk (KDIGO 2024).",
                        "Renal",
                        is_contraindication=True,
                    )
                    _add_alternative(
                        SaferAlternativeSchema(
                            original_brand=med.brand_name,
                            original_generic="Metformin",
                            alternative_brand="Linaglip 5mg / Trajenta 5mg",
                            alternative_generic="Linagliptin",
                            clinical_rationale="Linagliptin is eliminated hepatically/biliary and requires zero dose adjustment even in CKD Stage 4-5 without lactic acidosis risk.",
                            safety_benefit="Maintains glycemic control safely in severe renal impairment.",
                            precautions="Monitor HbA1c and fasting glucose after transition.",
                            requires_clinician_approval=True,
                        )
                    )
                elif is_ckd_mod:
                    _add_issue(
                        med,
                        "RENAL_DOSE_ADJUSTMENT",
                        "WARNING",
                        f"Moderate CKD (eGFR {patient.egfr} mL/min): cap Metformin at <= 1000 mg/day and monitor eGFR every 3 months.",
                        "Renal",
                    )

            if _has_generic(gen, RENAL_NSAIDS) and is_ckd_mod:
                _add_issue(
                    med,
                    "RENAL_NSAID_AKI_CONTRAINDICATION",
                    "CRITICAL",
                    f"Systemic NSAIDs are contraindicated in CKD (eGFR {patient.egfr or '<45'} mL/min) due to afferent arteriolar constriction and acute kidney injury (KDIGO 2024).",
                    "Renal",
                    is_contraindication=True,
                )
                _add_alternative(
                    SaferAlternativeSchema(
                        original_brand=med.brand_name,
                        original_generic=gen or "NSAID",
                        alternative_brand="Napa Extend 665mg",
                        alternative_generic="Paracetamol",
                        clinical_rationale="Paracetamol provides analgesia without prostaglandin-mediated renal vasoconstriction.",
                        safety_benefit="Protects residual nephron perfusion in CKD.",
                        precautions="Limit total daily paracetamol to 3 g/day in CKD.",
                        requires_clinician_approval=True,
                    )
                )

            if ("spironolactone" in gen_lower or "potassium" in gen_lower) and is_ckd_severe:
                _add_issue(
                    med,
                    "RENAL_HYPERKALEMIA_CONTRAINDICATION",
                    "CRITICAL",
                    "Potassium-sparing/potassium therapy in CKD Stage 4-5 carries fatal hyperkalemia hazard.",
                    "Renal",
                    is_contraindication=True,
                )

            if _has_generic(gen, RENAL_DOSE_ADJUST) and is_ckd_mod:
                _add_issue(
                    med,
                    "RENAL_DOSE_ADJUSTMENT",
                    "WARNING",
                    f"{gen} requires renal dose reduction or extended dosing interval in CKD (eGFR {patient.egfr or '<45'} mL/min).",
                    "Renal",
                )

            # -----------------------------------------------------------------
            # 3. HEPATIC / LIVER IMPAIRMENT GUARDRAILS
            # -----------------------------------------------------------------
            if is_hepatic:
                if "paracetamol" in gen_lower:
                    mg = _extract_mg(med.strength) or 500.0
                    freq = med.frequency_per_day or 2.0
                    daily_mg = mg * freq
                    if daily_mg > 2000.0:
                        _add_issue(
                            med,
                            "HEPATIC_PARACETAMOL_LIMIT",
                            "CRITICAL",
                            f"Hepatic impairment: prescribed Paracetamol ({int(daily_mg)} mg/day) exceeds safe liver ceiling of 2000 mg/day.",
                            "Hepatic",
                            is_contraindication=True,
                        )
                    else:
                        _add_issue(
                            med,
                            "HEPATIC_PARACETAMOL_CAUTION",
                            "WARNING",
                            "Hepatic impairment: ensure total Paracetamol from all sources stays <= 2000 mg/day.",
                            "Hepatic",
                        )
                if _has_generic(gen, HEPATIC_STATINS):
                    _add_issue(
                        med,
                        "HEPATIC_STATIN_CONTRAINDICATION",
                        "CRITICAL",
                        f"{gen} is contraindicated in active liver disease or unexplained transaminitis.",
                        "Hepatic",
                        is_contraindication=True,
                    )
                if _has_generic(gen, {"methotrexate", "domperidone", "diazepam", "alprazolam", "etoricoxib", "diclofenac"}):
                    _add_issue(
                        med,
                        "HEPATIC_TOXICITY_CONTRAINDICATION",
                        "CRITICAL",
                        f"{gen} carries severe hepatotoxicity, encephalopathy, or GI bleeding risk in liver impairment.",
                        "Hepatic",
                        is_contraindication=True,
                    )

            # -----------------------------------------------------------------
            # 4. PREGNANCY TERATOGENICITY GUARDRAILS
            # -----------------------------------------------------------------
            if is_pregnant and _has_generic(gen, PREGNANCY_TERATOGENS):
                _add_issue(
                    med,
                    "PREGNANCY_TERATOGEN_CONTRAINDICATION",
                    "CRITICAL",
                    f"{gen} is contraindicated in pregnancy due to documented fetal toxicity / teratogenicity.",
                    "Pregnancy",
                    is_contraindication=True,
                )
                if _has_generic(gen, {"ramipril", "enalapril", "lisinopril", "losartan", "olmesartan", "telmisartan", "valsartan", "candesartan"}):
                    _add_alternative(
                        SaferAlternativeSchema(
                            original_brand=med.brand_name,
                            original_generic=gen,
                            alternative_brand="Labetalol / Methyldopa / Nifedipine SR",
                            alternative_generic="Labetalol / Methyldopa",
                            clinical_rationale="ACE inhibitors and ARBs cause fetal renal dysplasia and oligohydramnios. Methyldopa, Labetalol, or extended-release Nifedipine are first-line gestational antihypertensives.",
                            safety_benefit="Eliminates fetotoxic RAAS blockade during pregnancy.",
                            precautions="Obstetric BP monitoring required.",
                            requires_clinician_approval=True,
                        )
                    )

            # -----------------------------------------------------------------
            # 5. PEDIATRIC WEIGHT & AGE GUARDRAILS
            # -----------------------------------------------------------------
            if patient.age < 18:
                if "aspirin" in gen_lower and patient.age < 16:
                    _add_issue(
                        med,
                        "PEDIATRIC_REYES_SYNDROME",
                        "CRITICAL",
                        "Aspirin in children/adolescents (<16 yrs) is contraindicated due to Reye's syndrome risk.",
                        "Pediatric",
                        is_contraindication=True,
                    )
                if _has_generic(gen, {"ciprofloxacin", "levofloxacin", "moxifloxacin"}):
                    _add_issue(
                        med,
                        "PEDIATRIC_FLUOROQUINOLONE_CONTRAINDICATION",
                        "CRITICAL",
                        f"Fluoroquinolone ({gen}) should be avoided under 18 years due to juvenile arthropathy/tendon risk.",
                        "Pediatric",
                        is_contraindication=True,
                    )
                if "doxycycline" in gen_lower and patient.age < 8:
                    _add_issue(
                        med,
                        "PEDIATRIC_TETRACYCLINE_CONTRAINDICATION",
                        "CRITICAL",
                        "Doxycycline is contraindicated under 8 years due to permanent dental enamel staining.",
                        "Pediatric",
                        is_contraindication=True,
                    )
                if "paracetamol" in gen_lower and patient.age < 16 and patient.weight_kg and patient.weight_kg > 0:
                    unit_mg = _extract_mg(med.strength)
                    freq = med.frequency_per_day
                    if unit_mg and freq:
                        daily_mg = unit_mg * freq
                        max_ped_mg = patient.weight_kg * 60.0  # 60 mg/kg/day ceiling
                        if daily_mg > max_ped_mg:
                            _add_issue(
                                med,
                                "PEDIATRIC_WEIGHT_OVERDOSE",
                                "CRITICAL",
                                f"Pediatric Paracetamol overdose: {int(daily_mg)} mg/day exceeds weight-based ceiling of {int(max_ped_mg)} mg/day (60 mg/kg/day for {patient.weight_kg} kg).",
                                "Pediatric",
                                is_contraindication=True,
                            )

        return report
