"""Layer 1 entry point: image bytes -> validated, contract-shaped JSON."""
from __future__ import annotations
import difflib, time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional

from .extractor import Extractor, get_extractor
from .preprocess import prepare_image
from .schemas import RawMedicine, RawPrescription
from .validator import validate_prescription

FIELDS = ["form", "strength", "generic_name_guess", "dosage_raw", "timing_raw", "duration_raw"]


def _norm(s: str) -> str:
    return "".join(ch for ch in s.lower() if ch.isalnum())


def _vote(values: list):
    vals = [v for v in values if v not in (None, "")]
    return Counter(vals).most_common(1)[0][0] if vals else None


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
            best = max(r.medicines, key=lambda m: difflib.SequenceMatcher(None, _norm(bm.brand_name), _norm(m.brand_name)).ratio(),
                       default=None)
            if best and difflib.SequenceMatcher(None, _norm(bm.brand_name), _norm(best.brand_name)).ratio() >= 0.7:
                matches.append(best)
        data = {f: _vote([getattr(m, f) for m in matches]) for f in FIELDS}
        # agreement = average share of passes agreeing with the winning value (+ presence)
        agree = []
        for f in FIELDS + ["brand_name"]:
            vals = [getattr(m, f) for m in matches]
            win = _vote(vals)
            agree.append(sum(v == win for v in vals) / len(vals) if win is not None else 1.0)
        presence = len(matches) / n
        merged.append(RawMedicine(
            brand_name=_vote([m.brand_name for m in matches]) or bm.brand_name,
            instructions_raw=bm.instructions_raw,
            confidence=sum(m.confidence for m in matches) / len(matches),
            agreement=round(min(presence, sum(agree) / len(agree)), 3), **data))
    out = base.model_copy(deep=True)
    out.medicines = merged
    out.legibility = sum(r.legibility for r in runs) / n
    out.is_prescription = sum(r.is_prescription for r in runs) > n / 2
    for f in ("patient_age_years", "patient_gender", "patient_weight_kg"):
        setattr(out, f, _vote([getattr(r, f) for r in runs]))
    return out


def analyze_prescription_image(image: bytes, patient_context: Optional[dict] = None,
                               extractor: Optional[Extractor] = None, votes: int = 1) -> dict:
    """votes=1 -> fast demo mode (~3-6 s). votes=3 -> accuracy mode (parallel passes, majority vote)."""
    t0 = time.perf_counter()
    extractor = extractor or get_extractor()
    img, mt = prepare_image(image)
    with ThreadPoolExecutor(max_workers=votes) as ex:
        runs = list(ex.map(lambda _: extractor.extract(img, mt), range(votes)))
    raw = vote_runs(runs)
    result = validate_prescription(raw, patient_context)
    result["meta"] = {"votes": votes, "latency_ms": int((time.perf_counter() - t0) * 1000),
                      "raw_extraction": raw.model_dump()}
    return result
