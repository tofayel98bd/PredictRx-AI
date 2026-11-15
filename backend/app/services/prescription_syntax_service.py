"""Prescription syntax validation and dose pattern parsing service."""

from dataclasses import dataclass
import re
from typing import List, Optional, Tuple

from app.schemas.analysis import IssueSchema, ValidatedMedicineSchema

BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
ABBR = {
    "od": 1, "qd": 1, "daily": 1, "hs": 1, "on": 1, "stat": 1,
    "bd": 2, "bid": 2, "tds": 3, "tid": 3, "qds": 4, "qid": 4,
    "sos": None, "prn": None,
}


@dataclass
class ParsedDose:
    status: str  # slots | abbr | prn | missing | invalid
    normalized: Optional[str] = None
    per_day: Optional[float] = None
    slots: Optional[List[float]] = None
    reason: str = ""


class PrescriptionSyntaxService:
    """Service validating Bangladeshi prescription syntax, dose frequency, and duration."""

    def parse_dosage(self, raw: Optional[str]) -> ParsedDose:
        if raw is None or not str(raw).strip():
            return ParsedDose("missing", reason="Dosage pattern missing")

        s = str(raw).lower().translate(BN_DIGITS)
        s = re.sub(r"\b(tab|tablet|cap|capsule|dose|daily)\b\.?", "", s) if s.strip() not in ABBR else s
        for u, v in {"½": "0.5", "¼": "0.25", "¾": "0.75"}.items():
            s = re.sub(rf"(\d){u}", lambda m, v=v: str(int(m.group(1)) + float(v)), s)
            s = s.replace(u, v)

        # Handle Bangla & English Spoon/Syrup format
        # e.g., "২ চামচ x ৩ বার", "1 tsp 3 times"
        spoon_match = re.search(
            r"(\d+(?:\.\d+)?)\s*(?:চামচ|চা\s*চামচ|tsp|tsf|ml|মি\.?লি\.?)\s*(?:করে)?\s*(?:[xX×*]|দিনে|দৈনিক)?\s*(\d+)\s*(?:বার|বেলা|times?)",
            s,
            re.IGNORECASE,
        )
        if spoon_match:
            amt = float(spoon_match.group(1))
            times = int(spoon_match.group(2))
            return ParsedDose(
                "slots",
                normalized=f"{amt:g}x{times}",
                per_day=amt * times,
                slots=[amt] * times,
                reason=f"Liquid/syrup dosing ({amt:g} unit x {times} times/day)",
            )

        s = re.sub(r"[–—−]", "-", s)
        s = re.sub(r"\s+", "", s).strip("()[].")

        if s in ABBR:
            pd = ABBR[s]
            if pd is None:
                return ParsedDose("prn", normalized=s.upper(), reason="As-needed (SOS/PRN)")
            return ParsedDose("abbr", normalized=s.upper(), per_day=float(pd), reason=f"Abbreviation {s.upper()}")

        for sep in ("+", "-", "/"):
            if sep in s:
                toks = s.split(sep)
                break
        else:
            return ParsedDose("invalid", reason=f"Unrecognized dosage format '{raw}'")

        try:
            vals = [float(t) for t in toks]
        except ValueError:
            return ParsedDose("invalid", reason=f"Non-numeric slot in '{raw}'")

        if len(vals) not in (2, 3, 4):
            return ParsedDose("invalid", reason=f"Dosage has {len(vals)} slots; expected 2, 3, or 4")

        return ParsedDose(
            "slots",
            normalized="+".join(f"{v:g}" for v in vals),
            per_day=sum(vals),
            slots=vals,
            reason="Standard daily slot pattern",
        )

    def parse_duration_days(self, raw: Optional[str]) -> Tuple[Optional[int], str]:
        """Extract duration in integer days from text strings (e.g. '5 days', '২ সপ্তাহ', '1 month')."""
        if not raw:
            return None, "Duration not specified"

        s = str(raw).lower().translate(BN_DIGITS)
        # Check days
        m_day = re.search(r"(\d+)\s*(?:day|days|দিন)", s)
        if m_day:
            return int(m_day.group(1)), f"{m_day.group(1)} days"

        # Check weeks
        m_week = re.search(r"(\d+)\s*(?:week|weeks|সপ্তাহ)", s)
        if m_week:
            days = int(m_week.group(1)) * 7
            return days, f"{days} days ({m_week.group(1)} weeks)"

        # Check months
        m_month = re.search(r"(\d+)\s*(?:month|months|মাস)", s)
        if m_month:
            days = int(m_month.group(1)) * 30
            return days, f"{days} days ({m_month.group(1)} months)"

        if "continue" in s or "চলবে" in s:
            return 90, "Continuous / Chronic therapy (30-90 days review)"

        return None, raw

    def validate_medicine(
        self,
        brand_name: str,
        generic_name: Optional[str],
        dose_raw: Optional[str],
        duration_raw: Optional[str],
        timing_raw: Optional[str] = None,
        strength: Optional[str] = None,
        form: Optional[str] = None,
        confidence: float = 0.95,
    ) -> ValidatedMedicineSchema:
        issues: List[IssueSchema] = []
        parsed_dose = self.parse_dosage(dose_raw)
        duration_days, duration_str = self.parse_duration_days(duration_raw)

        syntax_valid = parsed_dose.status in ("slots", "abbr", "prn")
        syntax_note = parsed_dose.reason

        if not syntax_valid:
            issues.append(
                IssueSchema(
                    code="SYNTAX_DOSE_INVALID",
                    severity="WARNING",
                    message=f"Ambiguous or invalid dose pattern '{dose_raw}' for {brand_name}.",
                )
            )

        # Check specific clinical duration ceilings (e.g. Ketorolac max 5 days)
        if generic_name:
            gen_lower = generic_name.lower()
            if "ketorolac" in gen_lower:
                if duration_days and duration_days > 5:
                    issues.append(
                        IssueSchema(
                            code="KETOROLAC_DURATION_EXCEEDED",
                            severity="CRITICAL",
                            message=f"Ketorolac prescribed for {duration_days} days. Strict ceiling is 5 days due to severe gastrointestinal bleeding and acute renal failure risk.",
                        )
                    )
                elif duration_days is None:
                    issues.append(
                        IssueSchema(
                            code="KETOROLAC_DURATION_MISSING",
                            severity="WARNING",
                            message="Ketorolac duration is not specified. Must not exceed 5 days.",
                        )
                    )

            if "metronidazole" in gen_lower and duration_days and duration_days > 14:
                issues.append(
                    IssueSchema(
                        code="METRONIDAZOLE_DURATION_EXCEEDED",
                        severity="WARNING",
                        message=f"Metronidazole prescribed for {duration_days} days. Extended courses (>14 days) increase risk of peripheral neuropathy.",
                    )
                )

        needs_review = any(i.severity == "CRITICAL" for i in issues) or not syntax_valid

        return ValidatedMedicineSchema(
            brand_name=brand_name,
            generic_name=generic_name,
            form=form or "Tablet",
            strength=strength or "",
            dosage_syntax=parsed_dose.normalized or dose_raw,
            frequency_per_day=parsed_dose.per_day,
            timing=timing_raw or "After Meal",
            duration_days=duration_days,
            syntax_valid=syntax_valid,
            syntax_note=syntax_note,
            issues=issues,
            confidence=confidence,
            needs_review=needs_review,
        )
