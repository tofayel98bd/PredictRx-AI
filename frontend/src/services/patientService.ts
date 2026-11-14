import { apiClient, ENABLE_MOCK_FALLBACK } from './apiClient';
import { Patient, PrescriptionAnalysisResult } from '../types';
import { DEMO_PATIENTS_LIST, DEMO_ANALYSIS_RESULT } from '../constants';

const patientsStore: Patient[] = [...DEMO_PATIENTS_LIST];

export async function getPatients(search?: string): Promise<Patient[]> {
  try {
    const response = await apiClient.get<Patient[]>('/api/v1/patients', {
      params: { search },
    });
    return response.data;
  } catch (error) {
    if (ENABLE_MOCK_FALLBACK) {
      await new Promise((r) => setTimeout(r, 200));
      if (!search || !search.trim()) return [...patientsStore];
      const q = search.toLowerCase();
      return patientsStore.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.conditions.some((c) => c.toLowerCase().includes(q))
      );
    }
    throw error;
  }
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  try {
    const response = await apiClient.get<Patient>(`/api/v1/patients/${id}`);
    return response.data;
  } catch (error) {
    if (ENABLE_MOCK_FALLBACK) {
      await new Promise((r) => setTimeout(r, 150));
      return patientsStore.find((p) => p.id === id) || patientsStore[0];
    }
    throw error;
  }
}

export async function getPatientPrescriptions(patientId: string): Promise<PrescriptionAnalysisResult[]> {
  try {
    const response = await apiClient.get<PrescriptionAnalysisResult[]>(`/api/v1/patients/${patientId}/prescriptions`);
    return response.data;
  } catch (error) {
    if (ENABLE_MOCK_FALLBACK) {
      await new Promise((r) => setTimeout(r, 200));
      return [DEMO_ANALYSIS_RESULT];
    }
    throw error;
  }
}
