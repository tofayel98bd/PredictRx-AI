import { apiClient, ENABLE_MOCK_FALLBACK } from './apiClient';
import { DrugInteraction } from '../types';
import { COMMON_DRUG_INTERACTIONS } from '../constants';

export async function getDrugInteractions(search?: string, severity?: string): Promise<DrugInteraction[]> {
  try {
    const response = await apiClient.get<DrugInteraction[]>('/api/v1/drug-interactions', {
      params: { search, severity },
    });
    return response.data;
  } catch (error) {
    if (ENABLE_MOCK_FALLBACK) {
      await new Promise((r) => setTimeout(r, 200));
      let results = [...COMMON_DRUG_INTERACTIONS];
      if (search && search.trim()) {
        const q = search.toLowerCase();
        results = results.filter(
          (i) =>
            i.drug_a.toLowerCase().includes(q) ||
            i.drug_b.toLowerCase().includes(q) ||
            i.mechanism?.toLowerCase().includes(q) ||
            i.clinical_significance.toLowerCase().includes(q)
        );
      }
      if (severity && severity !== 'ALL') {
        results = results.filter((i) => i.severity === severity);
      }
      return results;
    }
    throw error;
  }
}

export async function checkInteractionsDirect(drugs: string[]): Promise<DrugInteraction[]> {
  try {
    const response = await apiClient.post<DrugInteraction[]>('/api/v1/drug-interactions/check', {
      drugs,
    });
    return response.data;
  } catch (error) {
    if (ENABLE_MOCK_FALLBACK) {
      const lower = drugs.map((d) => d.toLowerCase());
      return COMMON_DRUG_INTERACTIONS.filter((i) =>
        lower.some((d) => i.drug_a.toLowerCase().includes(d) || i.drug_b.toLowerCase().includes(d))
      );
    }
    throw error;
  }
}
