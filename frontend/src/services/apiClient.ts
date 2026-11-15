import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const ENABLE_MOCK_FALLBACK = import.meta.env.VITE_ENABLE_MOCK_FALLBACK !== 'false';

// Fast mock in test environment, realistic 1000ms in development/production
const isTestEnv = import.meta.env.MODE === 'test';
export const MOCK_LATENCY_MS = isTestEnv ? 50 : (Number(import.meta.env.VITE_MOCK_LATENCY_MS) || 1000);

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});

// In test environment, bypass live network requests to ensure fast, isolated, deterministic test executions
if (isTestEnv) {
  apiClient.interceptors.request.use(() => {
    return Promise.reject(new Error('Test mode: isolated mock adapter'));
  });
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Only warn if not in silent test mode
    if (!isTestEnv) {
      console.warn(`[API Client] ${error.config?.method?.toUpperCase()} ${error.config?.url} failed: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export async function checkBackendHealth(): Promise<{ online: boolean; message: string }> {
  try {
    const res = await axios.get(`${BASE_URL}/health`, { timeout: 3000 });
    return { online: res.status === 200, message: 'Connected to FastAPI backend' };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Backend unreachable';
    return { online: false, message: `Backend offline (${errMsg}). Running in Safe Demo/Mock Adapter mode.` };
  }
}
