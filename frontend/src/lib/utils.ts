import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getCurrentLanguage, SupportedLanguage } from '@/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BANGLA_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (digit) => BANGLA_DIGITS[digit] || digit);
}

function resolveLocale(lang?: string): string {
  const current = lang || getCurrentLanguage();
  return current.startsWith('bn') ? 'bn-BD' : 'en-US';
}

export function formatDateTime(dateStr?: string | Date, lang?: string): string {
  if (!dateStr) return 'N/A';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const locale = resolveLocale(lang);
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatDate(dateStr?: string | Date, lang?: string): string {
  if (!dateStr) return 'N/A';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const locale = resolveLocale(lang);
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatTime(dateStr?: string | Date, lang?: string): string {
  if (!dateStr) return 'N/A';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const locale = resolveLocale(lang);
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatNumber(
  value: number | string,
  lang?: string,
  options?: Intl.NumberFormatOptions
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  const locale = resolveLocale(lang);
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch {
    return String(value);
  }
}

export function formatPercent(value: number, lang?: string, decimals: number = 1): string {
  const locale = resolveLocale(lang);
  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(value);
    return `${formatted}%`;
  } catch {
    return `${value}%`;
  }
}

export function formatCurrency(amount: number, lang?: string): string {
  const locale = resolveLocale(lang);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `BDT ${amount}`;
  }
}
