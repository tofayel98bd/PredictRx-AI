# PredictRx-AI (PredictRx BD) — REST API Contract

> **Clinical Decision Support System (CDSS) for Medication Safety, Bangladesh DGDA Drug Catalog Normalization, and Explainable Prescription Risk Analysis.**

---

## 1. Architectural Principles & Safety Disclaimers

1. **Non-Diagnostic, Decision Support System**: PredictRx-AI is a clinician-assistive tool. It does not replace the independent medical judgment of licensed physicians or pharmacists.
2. **Transparent Evidence-Base**: Risk scores, interactions, and duration warnings cite established clinical guidelines (KDIGO 2024, BNF 86, Beers 2023 Criteria, and DGDA pharmacovigilance advisories).
3. **Deterministic Core**: Dose syntax validation, duration ceiling enforcement (e.g. Ketorolac max 5 days), and pairwise interaction lookups are deterministic and verifiable.

---

## 2. Base URL & Protocol

- **Local Development**: `http://localhost:8000`
- **API Version**: `v1` (`/api/v1`)
- **Interactive Documentation**: `http://localhost:8000/docs` (Swagger UI) & `http://localhost:8000/redoc`
- **Authentication**: `Authorization: Bearer <JWT_TOKEN>` (for protected clinician actions)

---

## 3. Endpoints Directory

| Category | Method | Path | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **Diagnostics** | `GET` | `/health` | Application status & PostgreSQL health | No |
| **Diagnostics** | `GET` | `/api/v1/health` | Versioned system diagnostics | No |
| **Auth** | `POST` | `/api/v1/auth/login` | Clinician login & JWT token issuance | No |
| **Auth** | `POST` | `/api/v1/auth/register` | Register new clinician user | No |
| **Auth** | `GET` | `/api/v1/auth/me` | Current authenticated clinician profile | Yes |
| **CDSS Core** | `POST` | `/api/v1/predict-rx/analyze` | 8-Stage prescription analysis pipeline | No (Optional) |
| **CDSS Core** | `GET` | `/api/v1/predict-rx/prescriptions` | Historical analyzed prescriptions | No |
| **CDSS Core** | `GET` | `/api/v1/predict-rx/prescriptions/{id}`| Analysis result by Prescription/Analysis ID | No |
| **CDSS Core** | `POST` | `/api/v1/predict-rx/prescriptions/{id}/review` | Clinician review sign-off & modification | No (Optional) |
| **Patients** | `GET` | `/api/v1/patients` | List patients (Frontend card schema) | No |
| **Patients** | `GET` | `/api/v1/patients/{id}` | Patient demographics & lab profile | No |
| **Patients** | `POST` | `/api/v1/patients` | Register new patient & clinical profile | No |
| **Patients** | `GET` | `/api/v1/patients/{id}/prescriptions` | Patient historical prescriptions | No |
| **Interactions**| `GET` | `/api/v1/drug-interactions` | Search drug interaction matrix | No |
| **Interactions**| `POST` | `/api/v1/drug-interactions/check` | Multi-drug polypharmacy & Triple Whammy check | No |
| **Interactions**| `GET` | `/api/v1/drug-interactions/{id}` | Specific interaction details | No |
| **Drugs** | `GET` | `/api/v1/drugs` | Bangladesh DGDA drug catalog search | No |
| **Drugs** | `GET` | `/api/v1/drugs/{id}` | Single DGDA drug catalog entry | No |
| **Evidence** | `GET` | `/api/v1/evidence` | Clinical guidelines and citations | No |
| **Dashboard** | `GET` | `/api/v1/dashboard/overview` | Aggregated clinical safety metrics | No |
| **Reports** | `GET` | `/api/v1/reports/{prescription_id}`| Full structured audit report for printing | No |

---

## 4. Primary CDSS Analysis Endpoint

### `POST /api/v1/predict-rx/analyze`

Executes the complete 8-stage Clinical Decision Support analysis pipeline:
1. File validation / text extraction.
2. Patient clinical profile binding.
3. Dose syntax & duration validation (`1+0+1`, spoonfuls, duration ceilings).
4. Bangladesh brand-to-generic catalog normalization.
5. Pairwise interaction & "Triple Whammy" (ACEi/ARB + Diuretic + NSAID) detection.
6. Multi-factor clinical risk scoring & SHAP feature breakdown.
7. Safer clinical alternative suggestions.
8. Bengali patient companion instructions generation.

#### Request Formats Supported:

##### A. Multipart Form-Data (Frontend Image Upload Flow)
- `prescription_file`: Binary file (`.png`, `.jpg`, `.jpeg`, `.pdf`)
- `patient_context`: JSON string serialized from `PatientContext`

##### B. Application/JSON (Direct API Consumer Flow)
```json
{
  "patient_context": {
    "name": "Mohammad Abdul Karim",
    "age": 68,
    "gender": "Male",
    "creatinine": 2.4,
    "egfr": 28.5,
    "conditions": ["CKD Stage 4", "Hypertension", "Type 2 Diabetes"],
    "current_medications": ["Ramipril 5mg OD"],
    "allergies": ["Penicillin"]
  },
  "medications": [
    {
      "brand_name": "Rolac 10mg",
      "generic_name": "Ketorolac Tromethamine",
      "dosage_syntax": "1+0+1",
      "duration_raw": "14 days",
      "timing": "After Meal"
    },
    {
      "brand_name": "Sergel 20",
      "generic_name": "Esomeprazole",
      "dosage_syntax": "1+0+0",
      "duration_raw": "14 days",
      "timing": "Before Meal"
    }
  ]
}
```

#### Response: `200 OK` (`PrescriptionAnalysisResult`)
```json
{
  "analysis_id": "c1f71587-f8e1-4543-9ce6-55452d3a9bb7",
  "prescription_id": "RX-20261115-4D2A",
  "timestamp": "2026-11-15T20:29:48.123456Z",
  "status": "COMPLETED",
  "meta": {
    "votes": 1,
    "latency_ms": 112,
    "ocr_engine": "PredictRx Hybrid Vision Pipeline v1.0",
    "legibility": 0.96,
    "is_prescription": true
  },
  "detected_patient": {
    "age": 68,
    "gender": "Male",
    "weight_kg": null
  },
  "patient_context": {
    "name": "Mohammad Abdul Karim",
    "age": 68,
    "gender": "Male",
    "creatinine": 2.4,
    "egfr": 28.5,
    "conditions": ["CKD Stage 4", "Hypertension", "Type 2 Diabetes"],
    "current_medications": ["Ramipril 5mg OD"],
    "allergies": ["Penicillin"],
    "pregnancy": false
  },
  "extracted_prescription": [
    {
      "brand_name": "Rolac 10mg",
      "generic_name": "Ketorolac Tromethamine",
      "form": "Tablet",
      "strength": "10 mg",
      "dosage_syntax": "1+0+1",
      "frequency_per_day": 2.0,
      "timing": "After Meal",
      "duration_days": 14,
      "syntax_valid": true,
      "syntax_note": "Standard daily slot pattern",
      "issues": [
        {
          "code": "KETOROLAC_DURATION_EXCEEDED",
          "severity": "CRITICAL",
          "message": "Ketorolac prescribed for 14 days. Strict ceiling is 5 days due to severe gastrointestinal bleeding and acute renal failure risk."
        }
      ],
      "confidence": 0.85,
      "needs_review": true
    }
  ],
  "prescription_level_alerts": [
    {
      "code": "DRUG_INTERACTION_CRITICAL",
      "severity": "CRITICAL",
      "message": "Ketorolac Tromethamine + Ramipril: Acute Kidney Injury (AKI), reduced antihypertensive efficacy, severe hyperkalemia."
    }
  ],
  "drug_interactions": [
    {
      "id": "180b726c-d102-4fc9-b68a-2c8cbb42ea39",
      "drug_a": "Ketorolac Tromethamine",
      "drug_b": "Ramipril",
      "severity": "CRITICAL",
      "mechanism": "ACE inhibitors dilate the efferent renal arteriole while NSAIDs inhibit prostaglandin-mediated afferent arteriolar vasodilation.",
      "clinical_significance": "Acute Kidney Injury (AKI), reduced antihypertensive efficacy, severe hyperkalemia.",
      "evidence_source": "PredictRx Matrix (A)",
      "recommended_action": "Avoid concurrent use. If pain relief is essential, substitute Ketorolac with Paracetamol.",
      "management_protocol": "Clinical Review Required"
    }
  ],
  "clinical_risk": {
    "risk_score": 98.0,
    "risk_classification": "CRITICAL",
    "calibrated_probability_note": "Evidence-calibrated CDSS estimate based on KDIGO & Beers criteria. Requires clinician verification.",
    "is_synthetic_demo": false,
    "aki_risk_percentage": 83.3,
    "gi_bleed_risk_percentage": 68.6,
    "cardiovascular_risk_percentage": 44.1,
    "shap_features": [
      {
        "feature": "Severely Reduced eGFR (<30 mL/min)",
        "value": "28.5 mL/min",
        "impact_score": 0.45,
        "category": "Renal",
        "clinical_explanation": "Severely decreased filtration rate sharply reduces renal drug clearance."
      },
      {
        "feature": "Geriatric Age (>= 65 years)",
        "value": 68,
        "impact_score": 0.20,
        "category": "Age",
        "clinical_explanation": "Older adults have age-related reductions in renal plasma flow."
      },
      {
        "feature": "Ketorolac Duration Exceeds 5-Day Ceiling",
        "value": "14 days",
        "impact_score": 0.35,
        "category": "Duration",
        "clinical_explanation": "Prescribing Ketorolac beyond 5 days carries an FDA black box warning."
      }
    ],
    "evidence_citations": [
      {
        "source": "KDIGO 2024 Practice Guideline",
        "title": "Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease",
        "year": 2024,
        "url": "https://kdigo.org/guidelines/ckd-evaluation-and-management/"
      }
    ]
  },
  "safer_alternatives": [
    {
      "original_brand": "Rolac 10mg",
      "original_generic": "Ketorolac Tromethamine",
      "alternative_brand": "Napa Extend 665mg",
      "alternative_generic": "Paracetamol",
      "clinical_rationale": "Ketorolac is contraindicated in renal impairment / co-therapy due to AKI and GI bleed danger.",
      "safety_benefit": "Renal-sparing; does not inhibit renal prostaglandin synthesis.",
      "precautions": "Ensure total daily paracetamol dose does not exceed 3-4 g/day.",
      "requires_clinician_approval": true
    }
  ],
  "bangla_companion": {
    "patient_name_bengali": "Mohammad Abdul Karim",
    "patient_id": "PRX-2026-0001",
    "date_bengali": "15-11-2026",
    "overview_bengali": "আপনার প্রেসক্রিপশনের মোট ২ টি ওষুধের সহজ নির্দেশনা নিচে দেওয়া হলো।",
    "medicines": [
      {
        "brand_name": "Rolac 10mg",
        "generic_name": "Ketorolac Tromethamine",
        "bengali_brand_name": "Rolac 10mg",
        "dosage_bengali": "সকালে ১টি ও রাতে ১টি",
        "timing_bengali": "খাবার পরে ভরা পেটে খাবেন",
        "duration_bengali": "14 দিন পর্যন্ত",
        "purpose_bengali": "তীব্র স্বল্পমেয়াদী ব্যথা কমানোর জন্য",
        "safety_warnings_bengali": ["এই ওষুধটি ৫ দিনের বেশি খাবেন না। পেট ব্যথা বা বমি ভাব হলে ডাক্তারকে জানান।"],
        "missed_dose_advice_bengali": "কোনো ডোজ ভুলে গেলে মনে পড়ার সাথে সাথে খেয়ে নিন।"
      }
    ],
    "critical_safety_notice_bengali": "⚠️ জরুরি সতর্কতা: আপনার প্রেসক্রিপশনে কিছু সংবেদনশীল ওষুধের প্রভাব রয়েছে...",
    "emergency_instructions_bengali": "যদি তীব্র পেট ব্যথা, কালো পায়খানা, শ্বাসকষ্ট দেখা দেয়, তবে অবিলম্বে জরুরি বিভাগে যোগাযোগ করুন।"
  },
  "summary": {
    "medicine_count": 2,
    "syntax_errors_count": 0,
    "critical_issues_count": 2,
    "needs_review_count": 1,
    "legibility": 0.96,
    "overall_safety_rating": "HIGH_RISK_INTERVENTION_NEEDED"
  },
  "clinician_review": {
    "reviewed": false,
    "reviewer_name": null,
    "decision": null
  }
}
```

---

## 5. Clinician Review Sign-off Endpoint

### `POST /api/v1/predict-rx/prescriptions/{id}/review`

#### Request Body:
```json
{
  "reviewer_name": "Dr. Rafiqul Islam",
  "reviewer_license": "BMDC #A-45892",
  "decision": "MODIFIED",
  "notes": "Discontinued Ketorolac immediately due to CKD stage 4. Substituted with Paracetamol 665mg PRN."
}
```

#### Response: `200 OK`
Returns the updated `PrescriptionAnalysisResult` with `clinician_review.reviewed: true` and logs immutable audit trail in `prescription_audit_logs`.

---

## 6. Polypharmacy Direct Checking Endpoint

### `POST /api/v1/drug-interactions/check`

#### Request Body:
```json
{
  "drugs": ["Ramipril", "Furosemide", "Ketorolac"]
}
```

#### Response: `200 OK`
Returns detected pairwise interactions along with multi-drug clinical syndromes such as the **Triple Whammy** (ACEi/ARB + Diuretic + NSAID).
