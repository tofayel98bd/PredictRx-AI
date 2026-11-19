/**
 * Authentication Service for PredictRx-AI.
 * Connects to FastAPI `/api/v1/auth/*` endpoints with intelligent local offline fallback
 * for seamless hackathon demonstrations and zero-friction clinician evaluation.
 */

import { apiClient, ENABLE_MOCK_FALLBACK } from './apiClient';

export interface ClinicianUser {
  id: string;
  email: string;
  full_name: string;
  role: 'doctor' | 'clinical_pharmacist' | 'admin' | 'nurse' | string;
  bmdc_number?: string;
  department?: string;
  preferred_language?: string;
  is_active?: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  full_name: string;
  email: string;
  password?: string;
  role: string;
  bmdc_number?: string;
  department?: string;
  preferred_language?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  user: ClinicianUser;
}

// Preset Clinicians for Instant 1-Click Evaluation
export const PRESET_DEMO_CLINICIANS: (ClinicianUser & { passwordHint: string })[] = [
  {
    id: 'usr-demo-01',
    email: 'doctor@predictrx.bd',
    full_name: 'ডা. মো. রফিকুল ইসলাম',
    role: 'doctor',
    bmdc_number: 'A-45892',
    department: 'ইন্টারনাল মেডিসিন ও নেফ্রোলজি',
    preferred_language: 'bn',
    passwordHint: 'Doctor123!',
  },
  {
    id: 'usr-demo-02',
    email: 'ashraful@predictrx.bd',
    full_name: 'ডা. মো. আশরাফুল হক',
    role: 'doctor',
    bmdc_number: 'এ-৮৯৪৬২',
    department: 'মেডিসিন ও কার্ডিওলজি',
    preferred_language: 'bn',
    passwordHint: 'Doctor123!',
  },
  {
    id: 'usr-demo-03',
    email: 'pharmacist@predictrx.bd',
    full_name: 'তাহরিমা সুলতানা, M.Pharm',
    role: 'clinical_pharmacist',
    bmdc_number: 'PH-90214',
    department: 'ক্লিনিক্যাল ফার্মাকোভিজিল্যান্স',
    preferred_language: 'bn',
    passwordHint: 'Pharma123!',
  },
];

const USER_STORAGE_KEY = 'predictrx_user';
const TOKEN_STORAGE_KEY = 'predictrx_token';
const REGISTERED_USERS_KEY = 'predictrx_registered_users';

function getLocalRegisteredUsers(): ClinicianUser[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRegisteredUser(user: ClinicianUser): void {
  try {
    const users = getLocalRegisteredUsers();
    users.push(user);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save user locally', err);
  }
}

export const authService = {
  getCurrentUser(): ClinicianUser | null {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  setCurrentSession(user: ClinicianUser, token: string): void {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (err) {
      console.error('Error saving auth session', err);
    }
  },

  logout(): void {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing auth session', err);
    }
  },

  async login(credentials: LoginCredentials): Promise<ClinicianUser> {
    const cleanEmail = credentials.email.trim().toLowerCase();

    // 1. Attempt live API login if backend is reachable
    try {
      const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', {
        email: cleanEmail,
        password: credentials.password || 'Doctor123!',
      });
      if (res.data && res.data.user) {
        this.setCurrentSession(res.data.user, res.data.access_token);
        return res.data.user;
      }
    } catch (apiErr) {
      if (!ENABLE_MOCK_FALLBACK) {
        throw apiErr;
      }
      console.warn('Backend login unavailable, activating intelligent clinician offline fallback');
    }

    // 2. Intelligent Offline Fallback: Check Presets & Registered Users
    const matchedPreset = PRESET_DEMO_CLINICIANS.find(
      (c) => c.email.toLowerCase() === cleanEmail
    );

    if (matchedPreset) {
      const mockToken = `mock-jwt-token-${matchedPreset.id}-${Date.now()}`;
      this.setCurrentSession(matchedPreset, mockToken);
      return matchedPreset;
    }

    const localUsers = getLocalRegisteredUsers();
    const matchedLocal = localUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (matchedLocal) {
      const mockToken = `mock-jwt-token-${matchedLocal.id}-${Date.now()}`;
      this.setCurrentSession(matchedLocal, mockToken);
      return matchedLocal;
    }

    // If new arbitrary email entered in offline/demo mode, construct custom clinician user
    const dynamicUser: ClinicianUser = {
      id: `usr-${Date.now().toString(36)}`,
      email: cleanEmail,
      full_name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      role: 'doctor',
      bmdc_number: `A-${Math.floor(10000 + Math.random() * 90000)}`,
      department: 'ক্লিনিক্যাল মেডিসিন',
      preferred_language: 'bn',
      is_active: true,
    };
    const mockToken = `mock-jwt-token-${dynamicUser.id}-${Date.now()}`;
    this.setCurrentSession(dynamicUser, mockToken);
    return dynamicUser;
  },

  async register(data: RegisterCredentials): Promise<ClinicianUser> {
    const cleanEmail = data.email.trim().toLowerCase();
    const payload = {
      email: cleanEmail,
      password: data.password || 'Doctor123!',
      full_name: data.full_name.trim(),
      role: data.role || 'doctor',
      bmdc_number: data.bmdc_number?.trim() || undefined,
      department: data.department?.trim() || 'General Medicine',
      preferred_language: data.preferred_language || 'bn',
    };

    // 1. Attempt live API registration
    try {
      const res = await apiClient.post<ClinicianUser>('/api/v1/auth/register', payload);
      if (res.data) {
        // Auto-login to obtain token
        return await this.login({ email: cleanEmail, password: payload.password });
      }
    } catch (apiErr) {
      if (!ENABLE_MOCK_FALLBACK) {
        throw apiErr;
      }
      console.warn('Backend register unavailable, creating local offline clinician profile');
    }

    // 2. Offline Fallback: create & persist registered user locally
    const newUser: ClinicianUser = {
      id: `usr-${Date.now().toString(36)}`,
      email: cleanEmail,
      full_name: payload.full_name,
      role: payload.role,
      bmdc_number: payload.bmdc_number || `A-${Math.floor(10000 + Math.random() * 90000)}`,
      department: payload.department,
      preferred_language: payload.preferred_language,
      is_active: true,
    };

    saveLocalRegisteredUser(newUser);
    const mockToken = `mock-jwt-token-${newUser.id}-${Date.now()}`;
    this.setCurrentSession(newUser, mockToken);
    return newUser;
  },
};
