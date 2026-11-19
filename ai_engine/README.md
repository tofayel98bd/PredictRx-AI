# PredictRx-AI — Layer 1: Multimodal Vision OCR & Clinical Syntax Validator

Deterministic, explainable prescription ingestion engine designed for handwritten and printed Bangladesh clinical prescriptions.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment (copy example)
cp .env.example .env

# 3. Run automated tests (15 unit & validation tests, no API key required)
python -m pytest tests -q

# 4. Run CLI on sample prescription
python cli.py samples/rx01.jpg --age 62 --gender Male --weight 68 --votes 3
```

---

## 🧠 System Architecture: "AI Reads, Rules Decide"

```
Image / PDF Input
       │
       ▼
Preprocess Pipeline (Auto-Rotate, Contrast Optimization, Grayscale Enhancement)
       │
       ▼
Multimodal Vision LLM (Strict JSON Schema Enforcement, Temperature 0.0)
       │
       ▼
Multi-Pass Voting (Optional N-Pass Parallel Ingestion with Field Majority Consensus)
       │
       ▼
Deterministic Rule Validator (DGDA Ceilings, Dosage Boundaries, Bengali Timing Syntax)
       │
       ▼
Standardized CDSS Contract Payload (Validated Structured JSON)
```

### Core Safety Guarantee:
The Large Language Model is utilized **exclusively for perceptual extraction** (reading messy handwriting, dosage text, and clinical notes). **Every medical safety decision**—including dosage ceilings, maximum durations, pediatric age thresholds, and drug interaction collisions—is enforced by deterministic clinical rule engines. This guarantees **100% reproducibility and zero hallucinations** on critical contraindications.

---

## 🔌 API Integration

```python
from app.pipeline import analyze_prescription_image

# Analyze raw prescription bytes with patient clinical context
result = analyze_prescription_image(
    image_bytes,
    patient_context={"age": 62, "gender": "Male", "weight_kg": 68.0},
    votes=1
)

# Returns structured contract matching the /api/v1/predict-rx/analyze schema
extracted_prescription = result["extracted_prescription"]
```

---

## 🔬 Clinical Safety & Regulatory Compliance

- **Bangladesh DGDA Alignment:** Drug trade names and dosage formulations are validated against official Directorate General of Drug Administration (DGDA) approved generics.
- **Duration & Ceiling Guardrails:** Strict duration ceilings (e.g., Ketorolac $\le$ 5 days) prevent preventable adverse drug events (ADEs).
- **Human-in-the-Loop:** Designed as a Clinical Decision Support System (CDSS) that empowers and assists licensed physicians, strictly requiring clinician verification prior to dispensing.
