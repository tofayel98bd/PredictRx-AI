export type Severity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface Issue {
  code: string;
  severity: Severity;
  message: string;
}

export interface RawMedicine {
  brand_name: string;
  form?: string | null;
  strength?: string | null;
  generic_name_guess?: string | null;
  dosage_raw?: string | null;
  timing_raw?: string | null;
  duration_raw?: string | null;
  instructions_raw?: string | null;
  confidence: number;
  agreement?: number;
}

export interface ValidatedMedicine {
  brand_name: string;
  generic_name?: string | null;
  form?: string | null;
  strength?: string | null;
  dosage_syntax?: string | null; // e.g., "1+0+1"
  frequency_per_day?: number | null;
  timing?: string | null;
  duration_days?: number | null;
  syntax_valid: boolean;
  syntax_note: string;
  issues: Issue[];
  confidence: number;
  needs_review: boolean;
}

export interface PrescriptionAlert {
  code: string;
  severity: Severity;
  message: string;
}

export interface PatientContext {
  id?: string;
  patient_id?: string;
  name?: string;
  age: number;
  gender?: 'Male' | 'Female' | 'Other';
  weight_kg?: number;
  creatinine?: number;
  egfr?: number;
  hba1c?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  alt_ast?: string;
  conditions: string[];
  current_medications: string[];
  allergies?: string[];
  pregnancy?: boolean;
}

export interface DrugInteraction {
  id: string;
  drug_a: string;
  drug_b: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFORMATIONAL';
  mechanism?: string;
  clinical_significance: string;
  evidence_source: string;
  recommended_action: string;
  management_protocol?: string;
}

export interface ShapContribution {
  feature: string;
  value: string | number;
  impact_score: number; // Positive increases risk, negative decreases
  category: 'Renal' | 'Dosage' | 'Interaction' | 'Patient Condition' | 'Age' | 'Duration';
  clinical_explanation: string;
}

export interface SaferAlternative {
  original_brand: string;
  original_generic: string;
  alternative_brand: string;
  alternative_generic: string;
  clinical_rationale: string;
  safety_benefit: string;
  precautions: string;
  requires_clinician_approval: boolean;
}

export interface ClinicalRiskAnalysis {
  risk_score: number; // 0 - 100
  risk_classification: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  calibrated_probability_note: string; // explicitly states calibration info or demo nature
  is_synthetic_demo: boolean;
  aki_risk_percentage?: number;
  gi_bleed_risk_percentage?: number;
  cardiovascular_risk_percentage?: number;
  shap_features: ShapContribution[];
  patient_specific_factors: string[];
  evidence_citations: {
    source: string;
    title: string;
    year: number;
    url?: string;
  }[];
  limitations: string[];
}

export interface BanglaMedicineInstruction {
  brand_name: string;
  generic_name: string;
  bengali_brand_name?: string;
  dosage_bengali: string; // e.g., "সকালে ১টি ও রাতে ১টি"
  timing_bengali: string; // e.g., "খাবার পরে ভরা পেটে খাবেন"
  duration_bengali: string; // e.g., "১৪ দিন পর্যন্ত"
  purpose_bengali: string; // e.g., "উচ্চ রক্তচাপ নিয়ন্ত্রণে"
  safety_warnings_bengali: string[];
  missed_dose_advice_bengali: string;
}

export interface BanglaPatientCompanion {
  patient_name_bengali?: string;
  patient_id: string;
  date_bengali: string;
  overview_bengali: string;
  medicines: BanglaMedicineInstruction[];
  critical_safety_notice_bengali: string;
  emergency_instructions_bengali: string;
  clinician_reviewed: boolean;
  reviewer_name?: string;
}

export interface PrescriptionAnalysisResult {
  analysis_id: string;
  prescription_id: string;
  timestamp: string;
  image_url?: string;
  file_name?: string;
  status: 'PENDING' | 'EXTRACTED' | 'VALIDATED' | 'COMPLETED' | 'FAILED';
  meta: {
    votes: number;
    latency_ms: number;
    ocr_engine: string;
    legibility: number;
    is_prescription: boolean;
  };
  detected_patient: {
    age?: number;
    gender?: string;
    weight_kg?: number;
  };
  patient_context: PatientContext;
  extracted_prescription: ValidatedMedicine[];
  prescription_level_alerts: PrescriptionAlert[];
  drug_interactions: DrugInteraction[];
  clinical_risk: ClinicalRiskAnalysis;
  safer_alternatives: SaferAlternative[];
  bangla_companion: BanglaPatientCompanion;
  summary: {
    medicine_count: number;
    syntax_errors_count: number;
    critical_issues_count: number;
    needs_review_count: number;
    legibility: number;
    overall_safety_rating: 'SAFE' | 'CAUTION_REQUIRED' | 'HIGH_RISK_INTERVENTION_NEEDED';
  };
  clinician_review: {
    reviewed: boolean;
    reviewer_name?: string;
    reviewer_license?: string;
    review_timestamp?: string;
    notes?: string;
    decision?: 'APPROVED' | 'MODIFIED' | 'REJECTED';
  };
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone?: string;
  blood_group?: string;
  creatinine: number;
  egfr: number;
  hba1c: number;
  conditions: string[];
  allergies: string[];
  active_prescriptions_count: number;
  last_analyzed: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}
