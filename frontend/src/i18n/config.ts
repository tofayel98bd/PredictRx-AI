import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations
import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enDashboard from './locales/en/dashboard.json';
import enAnalysis from './locales/en/analysis.json';
import enPrescriptions from './locales/en/prescriptions.json';
import enPatients from './locales/en/patients.json';
import enDrugs from './locales/en/drugs.json';
import enInteractions from './locales/en/interactions.json';
import enReports from './locales/en/reports.json';
import enSettings from './locales/en/settings.json';
import enValidation from './locales/en/validation.json';

// Bangla translations
import bnCommon from './locales/bn/common.json';
import bnNavigation from './locales/bn/navigation.json';
import bnDashboard from './locales/bn/dashboard.json';
import bnAnalysis from './locales/bn/analysis.json';
import bnPrescriptions from './locales/bn/prescriptions.json';
import bnPatients from './locales/bn/patients.json';
import bnDrugs from './locales/bn/drugs.json';
import bnInteractions from './locales/bn/interactions.json';
import bnReports from './locales/bn/reports.json';
import bnSettings from './locales/bn/settings.json';
import bnValidation from './locales/bn/validation.json';

export const SUPPORTED_LANGUAGES = ['en', 'bn'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const STORAGE_KEY = 'predictrx_language';

export const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    dashboard: enDashboard,
    analysis: enAnalysis,
    prescriptions: enPrescriptions,
    patients: enPatients,
    drugs: enDrugs,
    interactions: enInteractions,
    reports: enReports,
    settings: enSettings,
    validation: enValidation,
  },
  bn: {
    common: bnCommon,
    navigation: bnNavigation,
    dashboard: bnDashboard,
    analysis: bnAnalysis,
    prescriptions: bnPrescriptions,
    patients: bnPatients,
    drugs: bnDrugs,
    interactions: bnInteractions,
    reports: bnReports,
    settings: bnSettings,
    validation: bnValidation,
  },
} as const;

export function getInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'en' || saved === 'bn')) {
      return saved as SupportedLanguage;
    }
  } catch {
    // LocalStorage unavailable in sandbox/SSR
  }
  return DEFAULT_LANGUAGE;
}

const initialLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  ns: [
    'common',
    'navigation',
    'dashboard',
    'analysis',
    'prescriptions',
    'patients',
    'drugs',
    'interactions',
    'reports',
    'settings',
    'validation',
  ],
  interpolation: {
    escapeValue: false, // React handles XSS
  },
  react: {
    useSuspense: false,
  },
});

// Sync html lang attribute
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // Ignore storage errors
  }
});

export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  const targetLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  try {
    localStorage.setItem(STORAGE_KEY, targetLang);
  } catch {
    // Ignore storage errors
  }
  await i18n.changeLanguage(targetLang);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = targetLang;
  }
}

export function getCurrentLanguage(): SupportedLanguage {
  const lang = i18n.language || getInitialLanguage();
  return lang.startsWith('bn') ? 'bn' : 'en';
}

export default i18n;
