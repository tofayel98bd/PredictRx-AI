"""Layer 1 entry point: document bytes -> resilient adaptive Vision OCR -> validated JSON."""
from __future__ import annotations

import difflib
import logging
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional

from .extractor import Extractor, MockExtractor, get_extractor
from .preprocess import prepare_image
from .prompts import PROMPT_VERSION
from .schemas import RawMedicine, RawPrescription
from .validator import validate_prescription

logger = logging.getLogger("ai_engine.pipeline")

FIELDS = ["form", "strength", "generic_name_guess", "dosage_raw", "timing_raw", "duration_raw"]
ADAPTIVE_LEGIBILITY_THRESHOLD = 0.72
ADAPTIVE_CONFIDENCE_THRESHOLD = 0.75


def _norm(s: str) -> str:
    return "".join(ch for ch in s.lower() if ch.isalnum())


def _vote(values: list):
    vals = [v for v in values if v not in (None, "")]
    return Counter(vals).most_common(1)[0][0] if vals else None


def _needs_adaptive_revote(raw: RawPrescription) -> bool:
    """Trigger self-consistency multi-pass voting when image or medicine confidence is low."""
    if not raw.is_prescription:
        return False
    if raw.legibility < ADAPTIVE_LEGIBILITY_THRESHOLD:
        return True
    if any(m.confidence < ADAPTIVE_CONFIDENCE_THRESHOLD for m in raw.medicines):
        return True
    if len(raw.medicines) == 0 and raw.legibility >= 0.2:
        return True
    return False


def vote_runs(runs: List[RawPrescription]) -> RawPrescription:
    """Self-consistency: align medicines across passes by fuzzy brand name, majority-vote each field."""
    if len(runs) == 1:
        return runs[0]
    base = max(runs, key=lambda r: len(r.medicines))
    n = len(runs)
    merged: List[RawMedicine] = []
    for bm in base.medicines:
        matches = [bm]
        for r in runs:
            if r is base:
                continue
            best = max(
                r.medicines,
                key=lambda m: difflib.SequenceMatcher(None, _norm(bm.brand_name), _norm(m.brand_name)).ratio(),
                default=None,
            )
            if best and difflib.SequenceMatcher(None, _norm(bm.brand_name), _norm(best.brand_name)).ratio() >= 0.7:
                matches.append(best)
        data = {f: _vote([getattr(m, f) for m in matches]) for f in FIELDS}
        agree = []
        for f in FIELDS + ["brand_name"]:
            vals = [getattr(m, f) for m in matches]
            win = _vote(vals)
            agree.append(sum(v == win for v in vals) / len(vals) if win is not None else 1.0)
        presence = len(matches) / n
        merged.append(
            RawMedicine(
                brand_name=_vote([m.brand_name for m in matches]) or bm.brand_name,
                instructions_raw=_vote([m.instructions_raw for m in matches]) or bm.instructions_raw,
                confidence=sum(m.confidence for m in matches) / len(matches),
                agreement=round(min(presence, sum(agree) / len(agree)), 3),
                **data,
            )
        )
    out = base.model_copy(deep=True)
    out.medicines = merged
    out.legibility = sum(r.legibility for r in runs) / n
    out.is_prescription = sum(r.is_prescription for r in runs) > n / 2
    for f in (
        "patient_name",
        "patient_age_years",
        "patient_gender",
        "patient_weight_kg",
        "systolic_bp",
        "diastolic_bp",
        "creatinine_mg_dl",
        "egfr",
        "hba1c",
        "diagnosis_or_cc",
    ):
        setattr(out, f, _vote([getattr(r, f, None) for r in runs]))
    merged_allergies: List[str] = []
    seen_allergy = set()
    for r in runs:
        for a in getattr(r, "allergies", []) or []:
            key = a.strip().lower()
            if key and key not in seen_allergy:
                seen_allergy.add(key)
                merged_allergies.append(a.strip())
    out.allergies = merged_allergies
    return out


def analyze_prescription_image(
    image: bytes,
    patient_context: Optional[dict] = None,
    extractor: Optional[Extractor] = None,
    votes: int = 1,
    adaptive: bool = True,
) -> dict:
    """
    Execute Vision OCR + deterministic validation.
    - votes=1, adaptive=True: Fast pass (~2-5s), automatically upgrades to 3-pass self-consistency
      only when legibility < 0.72 or medicine confidence < 0.75.
    - votes=3: Explicit 3-pass parallel majority voting.
    """
    t0 = time.perf_counter()
    extractor = extractor or get_extractor()
    img, mt = prepare_image(image)
    adaptive_triggered = False

    if votes > 1:
        with ThreadPoolExecutor(max_workers=votes) as ex:
            runs = list(ex.map(lambda _: extractor.extract(img, mt), range(votes)))
    else:
        pass1 = extractor.extract(img, mt)
        runs = [pass1]
        if adaptive and not isinstance(extractor, MockExtractor) and _needs_adaptive_revote(pass1):
            adaptive_triggered = True
            logger.info(
                "Adaptive self-consistency triggered (legibility=%.2f, meds=%d); running 2 additional passes.",
                pass1.legibility,
                len(pass1.medicines),
            )
            try:
                with ThreadPoolExecutor(max_workers=2) as ex:
                    extra_futures = [ex.submit(extractor.extract, img, mt) for _ in range(2)]
                    for fut in extra_futures:
                        try:
                            runs.append(fut.result())
                        except Exception as exc:
                            logger.warning("Adaptive secondary pass failed gracefully: %s", type(exc).__name__)
            except Exception as exc:
                logger.warning("Adaptive pass pool failed gracefully: %s", type(exc).__name__)

    raw = vote_runs(runs)
    result = validate_prescription(raw, patient_context)
    provider_used = getattr(extractor, "last_provider_used", "vision-llm")
    model_used = getattr(extractor, "last_model_used", None)
    ocr_label = f"{provider_used.title()} Vision ({model_used})" if model_used else f"{provider_used.title()} Vision"
    if adaptive_triggered and len(runs) > 1:
        ocr_label += f" [Adaptive {len(runs)}-Pass Vote]"

    result["meta"] = {
        "votes": len(runs),
        "votes_executed": len(runs),
        "adaptive_triggered": adaptive_triggered,
        "prompt_version": PROMPT_VERSION,
        "provider": provider_used,
        "model": model_used,
        "ocr_engine": ocr_label,
        "legibility": round(raw.legibility, 3),
        "is_prescription": raw.is_prescription,
        "latency_ms": int((time.perf_counter() - t0) * 1000),
        "raw_extraction": raw.model_dump(),
    }
    return result
