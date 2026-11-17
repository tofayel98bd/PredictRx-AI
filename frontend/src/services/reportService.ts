import { PrescriptionAnalysisResult } from '../types';

export function exportAnalysisJson(data: PrescriptionAnalysisResult): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PredictRx_Report_${data.prescription_id}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerPrintReport(): void {
  window.print();
}

export async function downloadReportPdf(prescriptionId: string, lang: string = 'en'): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const url = `${baseUrl}/api/v1/reports/${prescriptionId}/pdf?lang=${lang}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to generate PDF: ${res.statusText}`);
  }
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `PredictRx_Report_${prescriptionId}_${lang}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}
