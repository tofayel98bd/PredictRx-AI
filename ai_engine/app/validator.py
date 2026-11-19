"""
Prescription Syntax Validator (deterministic rule engine - NO LLM involved).

Handles BD conventions: 1+0+1, 1-0-1, ১+০+১ (Bangla digits), ½+0+½, 1+1+1+1,
syrup/spoon formats ("২ চামচ x ৩ বার", "2 tsp 3 times"), BD/TDS/OD/HS/SOS abbreviations,
and durations ("14 days" / "২ সপ্তাহ" / "1 month" / "continue").
"""
from __future__ import annotations
import re
from collections import defaultdict
from dataclasses import dataclass
from typing import List, Optional, Tuple

from .drug_rules import BRAND_SEED, match_rule
from .schemas import Issue, RawMedicine, RawPrescription, ValidatedMedicine

BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
ABBR = {"od": 1, "qd": 1, "daily": 1, "hs": 1, "on": 1, "stat": 1,
        "bd": 2, "bid": 2, "tds": 3, "tid": 3, "qds": 4, "qid": 4,
        "sos": None, "prn": None}
SLOT_STEP = 0.25
MAX_SLOT = 4.0


def _fmt(x: float) -> str:
    return str(int(x)) if float(x).is_integer() else str(x).rstrip("0")


# ------------------------------------------------------------------ dosage
@dataclass
class ParsedDose:
    status: str                      # slots | abbr | prn | missing | invalid
    normalized: Optional[str] = None
    per_day: Optional[float] = None
    slots: Optional[List[float]] = None
    reason: str = ""


def _to_num(tok: str) -> Optional[float]:
    tok = tok.strip()
    if re.fullmatch(r"\d+(\.\d+)?", tok):
        return float(tok)
    m = re.fullmatch(r"(\d+)/(\d+)", tok)
    if m and int(m.group(2)) != 0:
        return int(m.group(1)) / int(m.group(2))
    return None


def parse_dosage(raw: Optional[str]) -> ParsedDose:
    if raw is None or not str(raw).strip():
        return ParsedDose("missing", reason="Dosage pattern missing")
    s = str(raw).lower().translate(BN_DIGITS)
    s = re.sub(r"\b(tab|tablet|cap|capsule|dose|daily)\b\.?", "", s) if s.strip() not in ABBR else s
    for u, v in {"½": "0.5", "¼": "0.25", "¾": "0.75"}.items():
        s = re.sub(rf"(\d){u}", lambda m, v=v: str(int(m.group(1)) + float(v)), s)
        s = s.replace(u, v)

    # Handle Bangla & English Spoon/Syrup format BEFORE stripping spaces
    # e.g., "২ চামচ x ৩ বার", "১ চামচ করে দিনে ৩ বার", "2 tsp x 3 times", "10 ml 3 times"
    spoon_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:চামচ|চা\s*চামচ|tsp|tsf|ml|মি\.?লি\.?)\s*(?:করে)?\s*(?:[xX×*]|দিনে|দৈনিক)?\s*(\d+)\s*(?:বার|বেলা|times?)",
        s,
        re.IGNORECASE,
    )
    if spoon_match:
        amt = float(spoon_match.group(1))
        times = int(spoon_match.group(2))
        if times == 3:
            slots = [amt, amt, amt]
        elif times == 2:
            slots = [amt, 0.0, amt]
        elif times == 1:
            slots = [0.0, 0.0, amt]
        elif times == 4:
            slots = [amt, amt, amt, amt]
        else:
            return ParsedDose("slots", normalized=f"{_fmt(amt)}x{times}", per_day=amt * times, slots=[amt] * times,
                              reason=f"Syrup/liquid dosing ({_fmt(amt)} unit x {times} times/day)")
        return ParsedDose("slots", normalized="+".join(_fmt(v) for v in slots), per_day=sum(slots), slots=slots,
                          reason=f"Syrup/liquid dosing ({_fmt(amt)} unit x {times} times/day)")

    s = re.sub(r"[–—−]", "-", s)
    s = re.sub(r"\s+", "", s).strip("()[].")
    if s in ABBR:
        pd = ABBR[s]
        if pd is None:
            return ParsedDose("prn", normalized=s.upper(), reason="As-needed (SOS/PRN) - no fixed schedule")
        return ParsedDose("abbr", normalized=s.upper(), per_day=float(pd), reason=f"Latin abbreviation {s.upper()}")
    for sep in ("+", "-", "/"):
        if sep in s:
            toks = s.split(sep)
            break
    else:
        return ParsedDose("invalid", reason=f"Unrecognised dosage format '{raw}'")
    vals = [_to_num(t) for t in toks]
    if any(v is None for v in vals):
        return ParsedDose("invalid", reason=f"Unrecognised dosage format '{raw}' (empty/non-numeric slot)")
    if len(vals) not in (2, 3, 4):
        return ParsedDose("invalid", reason=f"Dosage has {len(vals)} slots; expected 3 (morning+noon+night) or 4")
    return ParsedDose("slots", normalized="+".join(_fmt(v) for v in vals), per_day=sum(vals), slots=vals,
                      reason="2-slot pattern read as morning+night" if len(vals) == 2 else "")


# ---------------------------------------------------------------- duration
def parse_duration(raw: Optional[str]) -> Tuple[Optional[int], bool]:
    """-> (days or None, is_continuous)."""
    if not raw or not str(raw).strip():
        return None, False
    s = str(raw).lower().translate(BN_DIGITS).strip()
    if re.search(r"continu|ongoing|lifelong|চলবে|চলমান|nirantar|regular", s):
        return None, True
    m = re.search(r"(\d+(?:\.\d+)?)\s*(days?|d\b|দিন|সপ্তাহ|সপ্তা|weeks?|wks?|w\b|months?|mos?\b|মাস)", s)
    if not m:
        m2 = re.fullmatch(r"x?\s*(\d+)", s)           # bare "14" or "x14" -> days
        return (int(m2.group(1)), False) if m2 else (None, False)
    n, unit = float(m.group(1)), m.group(2)
    if unit.startswith(("w", "সপ্তা")):
        n *= 7
    elif unit.startswith(("m", "মাস")) and not unit.startswith("mi"):
        n *= 30
    return int(round(n)), False


# ------------------------------------------------------------------ timing
def normalize_timing(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    s = str(raw).lower()
    if re.search(r"empty|খালি|fasting", s):
        return "Empty Stomach"
    if re.search(r"bed|night|\bhs\b|\bon\b|ঘুম|রাতে|শোয়ার|শোয়ার", s):
        return "Bedtime"
    if re.search(r"\bwith\b|সাথে|সঙ্গে|মাঝে", s):
        return "With Meal"
    if re.search(r"before|\bac\b|a\.c|আগে|পূর্বে", s):
        return "Before Meal"
    if re.search(r"after|\bpc\b|p\.c|পরে|পর\b|ভরা\s*পেটে", s):
        return "After Meal"
    return None


# --------------------------------------------------------------- strength
def strength_mg(strength: Optional[str]) -> Optional[float]:
    if not strength:
        return None
    m = re.fullmatch(r"\s*(\d+(?:\.\d+)?)\s*(mg|g|mcg|µg)\s*", str(strength).lower().translate(BN_DIGITS))
    if not m:
        return None
    v, u = float(m.group(1)), m.group(2)
    return v * 1000 if u == "g" else v / 1000 if u in ("mcg", "µg") else v


def resolve_generic(med: RawMedicine) -> Optional[str]:
    if med.generic_name_guess:
        return med.generic_name_guess.strip()
    key = re.sub(r"\s+\d.*$", "", med.brand_name.lower().strip())     # drop strength suffix
    key = re.sub(r"^(tab|cap|syp|inj)\.?\s*", "", key)
    return BRAND_SEED.get(key) or BRAND_SEED.get(key.split()[0] if key else "")


# ------------------------------------------------------------------ engine
def _issue(issues, code, sev, msg):
    issues.append(Issue(code=code, severity=sev, message=msg))


def validate_medicine(med: RawMedicine, age: Optional[float] = None, gender: Optional[str] = None,
                      weight: Optional[float] = None) -> ValidatedMedicine:
    issues: List[Issue] = []
    generic = resolve_generic(med)
    dose = parse_dosage(med.dosage_raw)
    days, continuous = parse_duration(med.duration_raw)
    timing = normalize_timing(med.timing_raw)
    mg = strength_mg(med.strength)
    is_combo = bool(generic and "+" in generic)
    is_solid_oral = (med.form or "tab").lower().strip(". ") in ("tab", "tablet", "cap", "capsule", "")

    # --- format checks
    if dose.status == "missing":
        _issue(issues, "DOSE_MISSING", "WARNING", "Dosage pattern missing - cannot verify daily dose.")
    elif dose.status == "invalid":
        _issue(issues, "DOSE_FORMAT_INVALID", "CRITICAL", dose.reason)
    elif dose.status == "slots":
        if all(v == 0 for v in dose.slots):
            _issue(issues, "DOSE_ALL_ZERO", "CRITICAL", "Dosage 0+0+0: no dose is scheduled.")
        for v in dose.slots:
            if v < 0 or v > MAX_SLOT or (v / SLOT_STEP) % 1 != 0:
                _issue(issues, "DOSE_SLOT_IMPLAUSIBLE", "CRITICAL",
                       f"Implausible units per dose ({_fmt(v)}). Possible misread.")
                break
        else:
            if any(v > 2 for v in dose.slots) and is_solid_oral:
                _issue(issues, "DOSE_SLOT_HIGH", "WARNING", "More than 2 tablets/capsules in one slot - please confirm.")
        if dose.reason:
            _issue(issues, "DOSE_TWO_SLOT", "INFO", dose.reason)

    if med.duration_raw and days is None and not continuous:
        _issue(issues, "DURATION_UNREADABLE", "WARNING", f"Could not interpret duration '{med.duration_raw}'.")
    if days is None and not continuous and not med.duration_raw and dose.status != "prn":
        _issue(issues, "DURATION_MISSING", "WARNING", "Duration not specified.")
    if timing is None and med.timing_raw:
        _issue(issues, "TIMING_UNREADABLE", "INFO", f"Could not interpret timing '{med.timing_raw}'.")
    if timing is None and not med.timing_raw:
        _issue(issues, "TIMING_MISSING", "INFO", "Meal timing (before/after) not specified.")
    if not med.strength and not re.search(r"\d", med.brand_name):
        _issue(issues, "STRENGTH_MISSING", "WARNING", "Strength not written - confirm product strength.")
    if not generic:
        _issue(issues, "GENERIC_UNRESOLVED", "INFO", "Generic name unresolved locally; Layer 2 DB lookup required.")

    # --- drug-specific safety rules
    for key, rule in match_rule(generic):
        name = key.capitalize()
        if rule.get("max_duration_days") and days and days > rule["max_duration_days"]:
            _issue(issues, "DURATION_EXCEEDS_MAX", "CRITICAL",
                   f"{name} duration {days} days exceeds the {rule['max_duration_days']}-day safety limit. "
                   + rule.get("note", ""))
        cap = rule.get("elderly_max_daily_mg") if (age and age >= 65 and rule.get("elderly_max_daily_mg")) \
            else rule.get("max_daily_mg")
        if cap and mg and not is_combo and is_solid_oral and dose.per_day:
            daily = mg * dose.per_day
            if daily > cap:
                _issue(issues, "DAILY_DOSE_EXCEEDS_MAX", "CRITICAL",
                       f"{name}: {daily:g} mg/day exceeds max {cap:g} mg/day"
                       f"{' (age >= 65)' if cap != rule.get('max_daily_mg') else ''}.")
        if age is not None:
            if rule.get("min_age_years") and age < rule["min_age_years"]:
                _issue(issues, "AGE_BELOW_MIN", "CRITICAL",
                       rule.get("min_age_note") or f"{name} not recommended under {rule['min_age_years']} years (age {age:g}).")
            if age >= 65 and rule.get("beers"):
                _issue(issues, "ELDERLY_CAUTION", "WARNING", rule["beers"])
            if gender and gender.lower().startswith("f") and 12 <= age <= 50 and rule.get("pregnancy"):
                _issue(issues, "PREGNANCY_CAUTION", rule["pregnancy"],
                       f"{name}: avoid in pregnancy - pregnancy status not documented.")
    if age is not None and age < 12 and weight is None and mg:
        _issue(issues, "PEDIATRIC_WEIGHT_MISSING", "WARNING", "Child patient: weight needed to verify mg/kg dosing.")

    # --- confidence / review
    needs_review = (med.confidence < 0.8 or med.agreement < 0.67 or
                    any(i.code in ("DOSE_FORMAT_INVALID", "DOSE_SLOT_IMPLAUSIBLE", "DURATION_UNREADABLE") for i in issues))
    crit = [i for i in issues if i.severity == "CRITICAL"]
    syntax_valid = not crit and dose.status in ("slots", "abbr", "prn")
    if crit:
        note = "CRITICAL: " + crit[0].message
    elif dose.status == "missing":
        note = "Dosage missing"
    elif issues and any(i.severity == "WARNING" for i in issues):
        note = "Valid syntax; " + next(i.message for i in issues if i.severity == "WARNING")
    else:
        note = "Valid standard dosing"

    return ValidatedMedicine(
        brand_name=med.brand_name, generic_name=generic, form=med.form, strength=med.strength,
        dosage_syntax=dose.normalized, frequency_per_day=dose.per_day, timing=timing,
        duration_days=days, syntax_valid=syntax_valid, syntax_note=note, issues=issues,
        confidence=round(med.confidence * (0.5 + 0.5 * med.agreement), 3), needs_review=needs_review)


def validate_prescription(raw: RawPrescription, patient_context: Optional[dict] = None) -> dict:
    """Patient context (from DB/form) wins over values read from the paper."""
    ctx = patient_context or {}
    age = ctx.get("age", raw.patient_age_years)
    gender = ctx.get("gender", raw.patient_gender)
    weight = ctx.get("weight_kg", raw.patient_weight_kg)

    # Smart Fallback: If AI placed dosage or timing inside instructions_raw, recover them!
    for m in raw.medicines:
        if not m.dosage_raw and m.instructions_raw:
            if parse_dosage(m.instructions_raw).status not in ("missing", "invalid"):
                m.dosage_raw = m.instructions_raw
        if not m.timing_raw and m.instructions_raw:
            if normalize_timing(m.instructions_raw) is not None:
                m.timing_raw = m.instructions_raw
        if m.duration_raw and m.duration_raw.strip() in ("দিন", "মাস", "সপ্তাহ", "days", "day"):
            m.duration_raw = None

    meds = [validate_medicine(m, age, gender, weight) for m in raw.medicines]

    # prescription-level: therapeutic duplication (same generic twice)
    rx_alerts: List[dict] = []
    groups = defaultdict(list)
    for v in meds:
        if v.generic_name and "+" not in v.generic_name:
            groups[v.generic_name.lower()].append(v.brand_name)
    for g, brands in groups.items():
        if len(brands) > 1:
            rx_alerts.append({"code": "DUPLICATE_GENERIC", "severity": "WARNING",
                              "message": f"{g.title()} prescribed more than once ({', '.join(brands)}): "
                                         "risk of overdose through duplication."})
    if raw.legibility < 0.6:
        rx_alerts.append({"code": "LOW_LEGIBILITY", "severity": "WARNING",
                          "message": f"Image legibility low ({raw.legibility:.0%}); manual verification advised."})
    if not raw.is_prescription:
        rx_alerts.append({"code": "NOT_A_PRESCRIPTION", "severity": "CRITICAL",
                          "message": "Image does not appear to be a prescription."})

    return {
        "extracted_prescription": [m.model_dump() for m in meds],
        "prescription_level_alerts": rx_alerts,
        "detected_patient": {"name": getattr(raw, "patient_name", None), "age": age, "gender": gender, "weight_kg": weight},
        "summary": {
            "medicine_count": len(meds),
            "syntax_errors_count": sum(not m.syntax_valid for m in meds),
            "critical_issues_count": sum(i.severity == "CRITICAL" for m in meds for i in m.issues)
                                     + sum(a["severity"] == "CRITICAL" for a in rx_alerts),
            "needs_review_count": sum(m.needs_review for m in meds),
            "legibility": raw.legibility,
        },
    }
