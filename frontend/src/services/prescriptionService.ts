import { apiClient, ENABLE_MOCK_FALLBACK, MOCK_LATENCY_MS } from './apiClient';
import { PatientContext, PrescriptionAnalysisResult } from '../types';
import { DEMO_ANALYSIS_RESULT, GOLDEN_DEMO_SCENARIOS } from '../constants';

// In-memory store for session additions
const analysisStore: PrescriptionAnalysisResult[] = [
  DEMO_ANALYSIS_RESULT,
  {
    ...DEMO_ANALYSIS_RESULT,
    analysis_id: 'AN-2026-0940',
    prescription_id: 'RX-7650',
    timestamp: '2026-11-13T14:15:00Z',
    file_name: 'prescription_rokeya.png',
    patient_context: {
      id: 'PT-DEMO-042',
      patient_id: 'PRX-BD-2026-042',
      name: 'Begum Rokeya Sultana',
      age: 54,
      gender: 'Female',
      weight_kg: 62,
      creatinine: 0.9,
      egfr: 78.2,
      hba1c: 6.8,
      conditions: ['Osteoarthritis', 'Dyslipidemia'],
      current_medications: ['Atorvastatin 20mg HS'],
      allergies: ['Sulfa drugs'],
    },
    extracted_prescription: [
      {
        brand_name: 'Napa Extend 665mg',
        generic_name: 'Paracetamol',
        form: 'Tablet',
        strength: '665 mg',
        dosage_syntax: '1+0+1',
        frequency_per_day: 2,
        timing: 'After Meal',
        duration_days: 7,
        syntax_valid: true,
        syntax_note: 'Standard modified-release paracetamol dosage',
        confidence: 0.97,
        needs_review: false,
        issues: [],
      },
      {
        brand_name: 'Sergel 20',
        generic_name: 'Esomeprazole',
        form: 'Capsule',
        strength: '20 mg',
        dosage_syntax: '1+0+0',
        frequency_per_day: 1,
        timing: 'Before Meal',
        duration_days: 14,
        syntax_valid: true,
        syntax_note: 'Morning PPI dose before breakfast',
        confidence: 0.95,
        needs_review: false,
        issues: [],
      },
    ],
    prescription_level_alerts: [],
    drug_interactions: [],
    clinical_risk: {
      risk_score: 22,
      risk_classification: 'LOW',
      calibrated_probability_note: 'DEMO ESTIMATION — NOT CLINICALLY VALIDATED.',
      is_synthetic_demo: true,
      aki_risk_percentage: 12,
      gi_bleed_risk_percentage: 14,
      cardiovascular_risk_percentage: 18,
      patient_specific_factors: [
        'Normal renal function (eGFR 78.2 ml/min)',
        'Conservative analgesic choice without systemic NSAID toxicity',
      ],
      shap_features: [
        {
          feature: 'Renal-Sparing Analgesic (Paracetamol)',
          value: 'Napa Extend',
          impact_score: -0.35,
          category: 'Dosage',
          clinical_explanation: 'Low nephrotoxicity profile at standard doses.',
        },
        {
          feature: 'Patient Age (54 years)',
          value: 54,
          impact_score: +0.05,
          category: 'Age',
          clinical_explanation: 'Intermediate age baseline risk factor.',
        },
      ],
      evidence_citations: [
        {
          source: 'BNF 86 Guidelines',
          title: 'Paracetamol modified release dosing in osteoarthritis',
          year: 2024,
        },
      ],
      limitations: ['Synthetic test record.'],
    },
    summary: {
      medicine_count: 2,
      syntax_errors_count: 0,
      critical_issues_count: 0,
      needs_review_count: 0,
      legibility: 0.94,
      overall_safety_rating: 'SAFE',
    },
  },
];

export async function analyzePrescription(
  file: File,
  patientContext: PatientContext,
  onProgress?: (progress: number) => void
): Promise<PrescriptionAnalysisResult> {
  const formData = new FormData();
  formData.append('prescription_file', file);
  formData.append('patient_context', JSON.stringify(patientContext));

  try {
    const response = await apiClient.post<PrescriptionAnalysisResult>(
      '/api/v1/predict-rx/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(pct);
          }
        },
      }
    );
    analysisStore.unshift(response.data);
    return response.data;
  } catch (error) {
    if (ENABLE_MOCK_FALLBACK) {
      // Simulate pipeline progression delay
      await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

      // Construct a realistic result adapted to the uploaded file & patient context
      const isKetorolacScenario =
        patientContext.conditions?.some((c) => c.toLowerCase().includes('ckd') || c.toLowerCase().includes('kidney')) ||
        (patientContext.creatinine && patientContext.creatinine > 1.4);

      const generatedId = `AN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const result: PrescriptionAnalysisResult = {
        ...DEMO_ANALYSIS_RESULT,
        analysis_id: generatedId,
        prescription_id: `RX-${Math.floor(7000 + Math.random() * 2000)}`,
        timestamp: new Date().toISOString(),
        file_name: file.name,
        patient_context: patientContext,
        detected_patient: {
          age: patientContext.age,
          gender: patientContext.gender,
          weight_kg: patientContext.weight_kg,
        },
        clinical_risk: {
          ...DEMO_ANALYSIS_RESULT.clinical_risk,
          is_synthetic_demo: true,
          calibrated_probability_note: 'DEMO ESTIMATION — NOT CLINICALLY VALIDATED (Synthetic Mock Pipeline).',
          risk_score: isKetorolacScenario ? 86 : 28,
          risk_classification: isKetorolacScenario ? 'CRITICAL' : 'LOW',
        },
      };

      analysisStore.unshift(result);
      return result;
    }
    throw error;
  }
}

export async function getPrescriptionHistory(): Promise<PrescriptionAnalysisResult[]> {
  try {
    const response = await apiClient.get<PrescriptionAnalysisResult[]>('/api/v1/predict-rx/prescriptions');
    return response.data;
  } catch (error) {
    if (ENABLE_MOCK_FALLBACK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [...analysisStore];
    }
    throw error;
  }
}

export async function getPrescriptionById(id: string): Promise<PrescriptionAnalysisResult | undefined> {
  try {
    const response = await apiClient.get<PrescriptionAnalysisResult>(`/api/v1/predict-rx/prescriptions/${id}`);
    return response.data;
  } catch (error) {
    if (ENABLE_MOCK_FALLBACK) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return analysisStore.find((a) => a.analysis_id === id || a.prescription_id === id) || DEMO_ANALYSIS_RESULT;
    }
    throw error;
  }
}

export async function saveClinicianReview(
  id: string,
  review: {
    reviewer_name: string;
    reviewer_license?: string;
    decision: 'APPROVED' | 'MODIFIED' | 'REJECTED';
    notes?: string;
  }
): Promise<PrescriptionAnalysisResult> {
  try {
    const response = await apiClient.post<PrescriptionAnalysisResult>(
      `/api/v1/predict-rx/prescriptions/${id}/review`,
      review
    );
    return response.data;
  } catch (error) {
    if (ENABLE_MOCK_FALLBACK) {
      const item = analysisStore.find((a) => a.analysis_id === id || a.prescription_id === id) || DEMO_ANALYSIS_RESULT;
      item.clinician_review = {
        reviewed: true,
        reviewer_name: review.reviewer_name,
        reviewer_license: review.reviewer_license || 'BMDC #A-89412',
        review_timestamp: new Date().toISOString(),
        decision: review.decision,
        notes: review.notes,
      };
      return { ...item };
    }
    throw error;
  }
}

export async function fetchScenarioAnalysis(scenarioId: string): Promise<PrescriptionAnalysisResult> {
  try {
    const response = await apiClient.get<PrescriptionAnalysisResult>(`/api/v1/predict-rx/scenarios/${scenarioId}`);
    analysisStore.unshift(response.data);
    return response.data;
  } catch (error) {
    if (ENABLE_MOCK_FALLBACK) {
      const match = GOLDEN_DEMO_SCENARIOS.find((s) => s.scenario_id === scenarioId || s.id === scenarioId);
      if (match) {
        analysisStore.unshift(match.analysis_result);
        return match.analysis_result;
      }
      return DEMO_ANALYSIS_RESULT;
    }
    throw error;
  }
}
