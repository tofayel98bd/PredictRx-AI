import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setLanguage, getCurrentLanguage, SupportedLanguage } from '@/i18n';
import { toast } from 'sonner';

interface LanguageToggleProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className,
  showIcon = true,
}) => {
  const { i18n, t } = useTranslation('common');
  const currentLang = (i18n.language && i18n.language.startsWith('bn')) ? 'bn' : 'en';

  const handleLanguageChange = async (targetLang: SupportedLanguage) => {
    if (targetLang === currentLang) return;
    await setLanguage(targetLang);
    toast.success(
      targetLang === 'bn'
        ? 'ভাষা বাংলায় পরিবর্তন করা হয়েছে।'
        : 'Language switched to English.'
    );
  };

  return (
    <div
      role="group"
      aria-label={t('language.select', 'Select Language')}
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-muted/60 p-0.5 text-xs font-semibold shadow-inner transition-colors',
        className
      )}
    >
      {showIcon && (
        <span className="pl-1.5 pr-1 text-muted-foreground flex items-center" aria-hidden="true">
          <Globe className="h-3.5 w-3.5" />
        </span>
      )}

      {/* English Option */}
      <button
        type="button"
        role="button"
        aria-pressed={currentLang === 'en'}
        aria-label="Switch interface language to English"
        onClick={() => handleLanguageChange('en')}
        className={cn(
          'flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary',
          currentLang === 'en'
            ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
            : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
        )}
      >
        <span>English</span>
      </button>

      {/* Bangla Option */}
      <button
        type="button"
        role="button"
        aria-pressed={currentLang === 'bn'}
        aria-label="ইন্টারফেস ভাষা বাংলায় পরিবর্তন করুন"
        onClick={() => handleLanguageChange('bn')}
        className={cn(
          'flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary',
          currentLang === 'bn'
            ? 'bg-primary text-primary-foreground font-bold shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
        )}
      >
        <span className="font-semibold tracking-wide">বাংলা</span>
      </button>
    </div>
  );
};
