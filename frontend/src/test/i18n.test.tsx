import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import i18n, { setLanguage, getCurrentLanguage } from '@/i18n';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatCurrency,
  toBanglaDigits,
} from '@/lib/utils';

describe('Bilingual Internationalization (i18n) System', () => {
  beforeEach(async () => {
    localStorage.clear();
    await setLanguage('en');
  });

  afterEach(async () => {
    await setLanguage('en');
  });

  describe('Language Switcher & State Management', () => {
    it('initializes with English as default language', () => {
      expect(getCurrentLanguage()).toBe('en');
      expect(document.documentElement.lang).toBe('en');
    });

    it('switches language instantly to Bangla without page reload', async () => {
      await act(async () => {
        await setLanguage('bn');
      });

      expect(getCurrentLanguage()).toBe('bn');
      expect(i18n.language).toBe('bn');
      expect(document.documentElement.lang).toBe('bn');
    });

    it('persists selected language in localStorage under predictrx_language', async () => {
      await act(async () => {
        await setLanguage('bn');
      });

      expect(localStorage.getItem('predictrx_language')).toBe('bn');

      await act(async () => {
        await setLanguage('en');
      });

      expect(localStorage.getItem('predictrx_language')).toBe('en');
    });

    it('falls back to English if an unsupported language code is provided', async () => {
      await act(async () => {
        await setLanguage('fr' as any);
      });

      expect(getCurrentLanguage()).toBe('en');
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('LanguageToggle Component Accessibility', () => {
    it('renders with accessible role, aria-label, and pressed states', () => {
      render(<LanguageToggle />);

      const group = screen.getByRole('group', { name: /Select Language/i });
      expect(group).toBeInTheDocument();

      const enButton = screen.getByRole('button', { name: /Switch interface language to English/i });
      const bnButton = screen.getByRole('button', { name: /ইন্টারফেস ভাষা বাংলায় পরিবর্তন করুন/i });

      expect(enButton).toBeInTheDocument();
      expect(bnButton).toBeInTheDocument();
      expect(enButton).toHaveAttribute('aria-pressed', 'true');
      expect(bnButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('switches to Bangla when clicking the Bangla button', async () => {
      render(<LanguageToggle />);

      const bnButton = screen.getByRole('button', { name: /ইন্টারফেস ভাষা বাংলায় পরিবর্তন করুন/i });
      await act(async () => {
        fireEvent.click(bnButton);
      });

      expect(getCurrentLanguage()).toBe('bn');
      expect(bnButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Translation Dictionary Completeness across Namespaces', () => {
    it('resolves key translations in both English and Bangla', async () => {
      await setLanguage('en');
      expect(i18n.t('navigation:sidebar.dashboard')).toBe('Dashboard');
      expect(i18n.t('navigation:sidebar.prescriptions')).toBe('Prescription Records');
      expect(i18n.t('common:appName')).toBe('PredictRx-AI');
      expect(i18n.t('common:status.critical')).toBe('Critical');

      await setLanguage('bn');
      expect(i18n.t('navigation:sidebar.dashboard')).toBe('ড্যাশবোর্ড');
      expect(i18n.t('navigation:sidebar.prescriptions')).toBe('প্রেসক্রিপশন রেকর্ডস');
      expect(i18n.t('common:appName')).toBe('প্রেডিক্ট-আরএক্স এআই');
      expect(i18n.t('common:status.critical')).toBe('মারাত্মক ঝুঁকিপূর্ণ');
    });

    it('preserves standardized clinical abbreviations without alteration', async () => {
      await setLanguage('bn');
      // eGFR, HbA1c, CKD, AKI abbreviations should be maintained in clinical contexts
      const egfrText = i18n.t('analysis:patientForm.egfr');
      expect(egfrText).toContain('eGFR');
      expect(egfrText).toContain('mL/min');

      const hba1cText = i18n.t('analysis:patientForm.hba1c');
      expect(hba1cText).toContain('HbA1c');
    });
  });

  describe('Locale-Aware Formatting Utilities', () => {
    it('converts ASCII digits to Bengali numerals with toBanglaDigits', () => {
      expect(toBanglaDigits(1234567890)).toBe('১২৩৪৫৬৭৮৯০');
      expect(toBanglaDigits('BP: 120/80 mmHg')).toBe('BP: ১২০/৮০ mmHg');
    });

    it('formats numbers according to active locale', () => {
      // English formatting
      const numEn = formatNumber(12500, 'en');
      expect(numEn).toBe('12,500');

      // Bangla formatting
      const numBn = formatNumber(12500, 'bn');
      expect(numBn).toBe('১২,৫০০');
    });

    it('formats percentages appropriately across locales', () => {
      const pctEn = formatPercent(84, 'en');
      expect(pctEn).toBe('84%');

      const pctBn = formatPercent(84, 'bn');
      expect(pctBn).toBe('৮৪%');
    });

    it('formats BDT currency with symbol across locales', () => {
      const curEn = formatCurrency(500, 'en');
      expect(curEn).toContain('500');

      const curBn = formatCurrency(500, 'bn');
      expect(curBn).toContain('৫০০');
    });

    it('formats dates according to active locale', () => {
      const testDate = new Date('2026-11-17T12:00:00Z');
      const dateEn = formatDate(testDate, 'en');
      const dateBn = formatDate(testDate, 'bn');

      expect(dateEn).toBeDefined();
      expect(dateBn).toBeDefined();
      expect(dateBn).toMatch(/[০-৯]/); // Contains Bengali numerals
    });
  });
});
