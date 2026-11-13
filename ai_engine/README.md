# PredictRx BD - Layer 1: Vision + Syntax Validator (Tofayel / Day 1)

## Quick start
    pip install -r requirements.txt
    cp .env.example .env          # add ANTHROPIC_API_KEY (or GEMINI_API_KEY + LLM_PROVIDER=gemini)
    python -m pytest tests -q     # 15 tests, no API key needed
    python cli.py samples/rx01.jpg --age 62 --gender Male --weight 68 --votes 3

## Architecture
image -> preprocess (rotate/upscale/contrast) -> Vision LLM (forced JSON schema, temp 0)
      -> [optional N parallel passes + per-field majority vote] -> deterministic validator -> contract JSON

LLM only READS the paper. Every safety decision (format, duration, max dose, age, duplicates) is plain Python,
so it is explainable and testable. Mention this "LLM reads, rules decide" split to the judges.

## Hooking into Tarek's FastAPI (one function)
    from app.pipeline import analyze_prescription_image
    result = analyze_prescription_image(image_bytes, {"age": 62, "gender": "Male", "weight_kg": 68}, votes=1)
    # result["extracted_prescription"] -> goes into the /analyze-rx contract

## Handoffs
- Porag : replace BRAND_SEED in app/drug_rules.py with the bd_drugs_catalog lookup; map max_daily_dose_mg and
          max_duration_days columns into RULES so the DB is the single source of truth.
- Tahrima: fill eval/ground_truth.json with the 15 prescriptions, run eval_extraction.py, send me the mismatches.
- Jihad : render `issues[].severity` (CRITICAL=red, WARNING=amber, INFO=grey) and `needs_review` as a "verify" chip.

## !! Clinical verification
Limits in drug_rules.py are conservative prototype values. A pharmacist/doctor must verify them
against BNF / DGDA before the demo. Never present this as a substitute for professional judgement.
