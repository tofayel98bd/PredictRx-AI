import io, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from PIL import Image
from app.schemas import RawMedicine, RawPrescription
from app.validator import parse_dosage, parse_duration, normalize_timing, validate_medicine, validate_prescription
from app.extractor import MockExtractor
from app.pipeline import analyze_prescription_image, vote_runs


def M(**kw):
    kw.setdefault("brand_name", "Napa"); kw.setdefault("confidence", 0.95)
    return RawMedicine(**kw)


def codes(v): return {i.code for i in v.issues}


# ---- dosage parsing
def test_standard_patterns():
    assert parse_dosage("1+0+1").normalized == "1+0+1"
    assert parse_dosage("1-0-1").normalized == "1+0+1"
    assert parse_dosage("১-০-১").normalized == "1+0+1"          # Bangla digits
    assert parse_dosage("½+0+½").per_day == 1.0
    assert parse_dosage("1+1+1+1").per_day == 4
    assert parse_dosage("BD").per_day == 2 and parse_dosage("tds").per_day == 3
    assert parse_dosage("SOS").status == "prn"

def test_invalid_patterns():
    for bad in ["1++1", "abc", "1+0+x", "1+1+1+1+1", "5"]:
        assert parse_dosage(bad).status == "invalid", bad
    assert parse_dosage(None).status == "missing"

def test_duration():
    assert parse_duration("14 days") == (14, False)
    assert parse_duration("২ সপ্তাহ") == (14, False)
    assert parse_duration("1 month") == (30, False)
    assert parse_duration("continue") == (None, True)
    assert parse_duration("gibberish") == (None, False)

def test_timing():
    assert normalize_timing("খাবার পরে") == "After Meal"
    assert normalize_timing("a.c") == "Before Meal"
    assert normalize_timing("HS") == "Bedtime"


# ---- the 30-second GOLDEN demo case from the blueprint
def test_golden_rolac_14_days():
    v = validate_medicine(M(brand_name="Rolac 10", strength="10 mg", dosage_raw="1+1+1",
                            timing_raw="After Meal", duration_raw="14 days"), age=62, gender="Male")
    assert v.generic_name.lower().startswith("ketorolac")
    assert v.syntax_valid is False
    assert "DURATION_EXCEEDS_MAX" in codes(v)
    assert "ELDERLY_CAUTION" not in codes(v)                      # age 62 < 65 cutoff
    assert v.syntax_note.startswith("CRITICAL")

def test_ketorolac_elderly_flag():
    v = validate_medicine(M(brand_name="Rolac 10", strength="10 mg", dosage_raw="1+0+1", duration_raw="3 days"), age=70)
    assert "ELDERLY_CAUTION" in codes(v) and v.syntax_valid

def test_bizoran_valid():
    v = validate_medicine(M(brand_name="Bizoran 5/20", dosage_raw="1+0+0", timing_raw="After Meal",
                            duration_raw="30 days"), age=62)
    assert v.syntax_valid and v.generic_name == "Amlodipine + Olmesartan"
    assert v.syntax_note == "Valid standard dosing"

# ---- safety rules
def test_daily_dose_limit():
    v = validate_medicine(M(brand_name="Napa", strength="500 mg", dosage_raw="3+3+3+3", duration_raw="5 days"))   # 6000 mg/day
    assert "DAILY_DOSE_EXCEEDS_MAX" in codes(v) and not v.syntax_valid
    ok = validate_medicine(M(brand_name="Napa", strength="500 mg", dosage_raw="2+2+2+2", duration_raw="5 days"))
    assert "DAILY_DOSE_EXCEEDS_MAX" not in codes(ok)             # exactly 4 g/day is allowed

def test_pediatric_aspirin_and_weight():
    v = validate_medicine(M(brand_name="Ecospirin 75", strength="75 mg", dosage_raw="0+0+1", duration_raw="continue"), age=8)
    assert "AGE_BELOW_MIN" in codes(v) and "PEDIATRIC_WEIGHT_MISSING" in codes(v)

def test_all_zero_and_implausible():
    assert "DOSE_ALL_ZERO" in codes(validate_medicine(M(dosage_raw="0+0+0")))
    assert "DOSE_SLOT_IMPLAUSIBLE" in codes(validate_medicine(M(dosage_raw="1+0+9")))

def test_pregnancy_flag_only_for_women_of_childbearing_age():
    m = M(brand_name="Bizoran", dosage_raw="1+0+0", duration_raw="30 days")
    assert "PREGNANCY_CAUTION" in codes(validate_medicine(m, age=30, gender="Female"))
    assert "PREGNANCY_CAUTION" not in codes(validate_medicine(m, age=30, gender="Male"))

def test_missing_fields_are_flagged_not_crashing():
    v = validate_medicine(RawMedicine(brand_name="???", confidence=0.4))
    assert v.needs_review and "DOSE_MISSING" in codes(v)

def test_duplicate_paracetamol():
    raw = RawPrescription(medicines=[M(brand_name="Napa", dosage_raw="1+1+1", duration_raw="3 days"),
                                     M(brand_name="Ace", dosage_raw="1+0+1", duration_raw="3 days")])
    out = validate_prescription(raw)
    assert any(a["code"] == "DUPLICATE_GENERIC" for a in out["prescription_level_alerts"])


# ---- pipeline end-to-end with mock Vision LLM
def _png():
    b = io.BytesIO(); Image.new("RGB", (400, 600), "white").save(b, "PNG"); return b.getvalue()

def test_pipeline_end_to_end_contract_shape():
    fx = RawPrescription(medicines=[M(brand_name="Rolac 10", strength="10 mg", dosage_raw="1+1+1",
                                      timing_raw="after meal", duration_raw="14 days")])
    out = analyze_prescription_image(_png(), {"age": 62, "gender": "Male"}, MockExtractor(fx))
    med = out["extracted_prescription"][0]
    for k in ["brand_name", "generic_name", "dosage_syntax", "timing", "duration_days", "syntax_valid", "syntax_note"]:
        assert k in med
    assert med["timing"] == "After Meal" and med["duration_days"] == 14 and med["syntax_valid"] is False
    assert out["summary"]["critical_issues_count"] >= 1

def test_voting_majority_and_agreement():
    a = RawPrescription(medicines=[M(brand_name="Sergel 20", dosage_raw="1+0+1")])
    b = RawPrescription(medicines=[M(brand_name="Sergel 20", dosage_raw="1+0+1")])
    c = RawPrescription(medicines=[M(brand_name="Sergel 20", dosage_raw="1+1+1")])   # one noisy pass
    merged = vote_runs([a, b, c])
    assert merged.medicines[0].dosage_raw == "1+0+1"
    assert 0.6 < merged.medicines[0].agreement < 1.0
