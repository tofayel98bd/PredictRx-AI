import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  AlertCircle,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkBackendHealth } from '@/services/apiClient';
import { LanguageToggle } from './LanguageToggle';

interface TopNavProps {
  onOpenMobile: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobile }) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation(['navigation', 'common']);

  const [backendStatus, setBackendStatus] = useState<{ online: boolean; message: string }>({
    online: false,
    message: 'Checking backend status...',
  });
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    checkBackendHealth().then(setBackendStatus);
    const interval = setInterval(() => {
      checkBackendHealth().then(setBackendStatus);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const pathBase = '/' + location.pathname.split('/')[1];

  const getPageInfo = (base: string) => {
    switch (base) {
      case '/dashboard':
        return {
          title: t('header.titles.dashboard', { ns: 'navigation', defaultValue: 'Clinical Overview Dashboard' }),
          category: t('header.categories.executive', { ns: 'navigation', defaultValue: 'Executive Monitoring' }),
        };
      case '/analyze':
      case '/prescription-analysis':
        return {
          title: t('header.titles.analyze', { ns: 'navigation', defaultValue: 'Prescription OCR & Safety Analysis' }),
          category: t('header.categories.diagnostic', { ns: 'navigation', defaultValue: 'Diagnostic AI' }),
        };
      case '/prescriptions':
        return {
          title: t('header.titles.prescriptions', { ns: 'navigation', defaultValue: 'Prescription Records & History' }),
          category: t('header.categories.records', { ns: 'navigation', defaultValue: 'Clinical Records' }),
        };
      case '/patients':
        return {
          title: t('header.titles.patients', { ns: 'navigation', defaultValue: 'Patient Directory & Safety Profiles' }),
          category: t('header.categories.patientCare', { ns: 'navigation', defaultValue: 'Patient Care' }),
        };
      case '/drug-interactions':
        return {
          title: t('header.titles.drugInteractions', { ns: 'navigation', defaultValue: 'Drug Interaction Monitoring Center' }),
          category: t('header.categories.pharmacovigilance', { ns: 'navigation', defaultValue: 'Pharmacovigilance' }),
        };
      case '/risk-analysis':
        return {
          title: t('header.titles.clinicalRisk', { ns: 'navigation', defaultValue: 'Explainable Clinical Risk & SHAP Analysis' }),
          category: t('header.categories.intelligence', { ns: 'navigation', defaultValue: 'AI Intelligence' }),
        };
      case '/reports':
        return {
          title: t('header.titles.reports', { ns: 'navigation', defaultValue: 'Verified Clinical Decision Reports' }),
          category: t('header.categories.documentation', { ns: 'navigation', defaultValue: 'Documentation' }),
        };
      case '/bangla-companion':
        return {
          title: t('header.titles.banglaCompanion', { ns: 'navigation', defaultValue: 'Bangla Patient Companion (সহজ বাংলা নির্দেশিকা)' }),
          category: t('header.categories.literacy', { ns: 'navigation', defaultValue: 'Patient Literacy' }),
        };
      case '/settings':
        return {
          title: t('header.titles.settings', { ns: 'navigation', defaultValue: 'System Settings & Operational Preferences' }),
          category: t('header.categories.preferences', { ns: 'navigation', defaultValue: 'Preferences' }),
        };
      default:
        return {
          title: t('header.titles.default', { ns: 'navigation', defaultValue: 'Clinical Decision Support System' }),
          category: 'PredictRx-AI',
        };
    }
  };

  const pageInfo = getPageInfo(pathBase);
  const titleStr = typeof pageInfo?.title === 'string' && pageInfo.title ? pageInfo.title : 'PredictRx-AI';
  const categoryStr = typeof pageInfo?.category === 'string' && pageInfo.category ? pageInfo.category : 'PredictRx';
  const firstWord = titleStr.split(' ')[0] || '';

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-border bg-card/95 px-2.5 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile trigger & Page title */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 mr-1.5 sm:mr-3">
        <button
          onClick={onOpenMobile}
          className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground lg:hidden hover:bg-muted"
          aria-label={t('sidebar.expand', { ns: 'navigation', defaultValue: 'Open navigation menu' })}
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="hidden md:flex items-center space-x-2 text-xs text-muted-foreground">
            <span>{categoryStr}</span>
            <span>/</span>
            <span className="font-medium text-foreground truncate max-w-[220px]">{titleStr}</span>
          </div>
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground tracking-tight truncate">
            {titleStr}
          </h1>
        </div>
      </div>

      {/* Right controls: Language Toggle, Backend Status, Notifications, Theme, Profile */}
      <div className="flex items-center space-x-1 sm:space-x-2.5 shrink-0">
        {/* Global Language Toggle */}
        <LanguageToggle />

        {/* API Connection Indicator */}
        <div
          className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs border font-medium cursor-default"
          title={backendStatus.message}
        >
          {backendStatus.online ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 dark:text-emerald-400">
                {t('safety.fastapiLive', { ns: 'common', defaultValue: 'FastAPI Live' })}
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-blue-700 dark:text-blue-300">
                {t('safety.safeDemoAdapter', { ns: 'common', defaultValue: 'Safe Demo Adapter' })}
              </span>
            </>
          )}
        </div>

        {/* Clinical Alert Notification Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-8 w-8 sm:h-9 sm:w-9"
            aria-label={t('header.notifications.button', { ns: 'navigation', defaultValue: 'Clinical safety notifications' })}
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </Button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto sm:right-0 top-14 sm:top-auto sm:mt-2 w-auto sm:w-96 rounded-xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-sm">
                    {t('header.notifications.title', { ns: 'navigation' })}
                  </span>
                </div>
                <Badge variant="critical">
                  {t('header.notifications.unreviewed', { ns: 'navigation', count: 2 })}
                </Badge>
              </div>

              <div className="py-2 space-y-2.5 max-h-72 overflow-y-auto">
                <Link
                  to="/analyze"
                  onClick={() => setShowNotifications(false)}
                  className="block p-2.5 rounded-lg border border-red-200 bg-red-50/60 dark:bg-red-950/30 hover:bg-red-100/60 transition"
                >
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-900 dark:text-red-300">
                        {t('header.notifications.highAkiTitle', { ns: 'navigation' })}
                      </p>
                      <p className="text-[11px] text-red-700/80 dark:text-red-400 mt-0.5">
                        {t('header.notifications.highAkiDesc', { ns: 'navigation' })}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/30">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                        {t('header.notifications.ceilingTitle', { ns: 'navigation' })}
                      </p>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                        {t('header.notifications.ceilingDesc', { ns: 'navigation' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border text-center">
                <Link
                  to="/drug-interactions"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  {t('header.notifications.viewMonitor', { ns: 'navigation' })}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 sm:h-9 sm:w-9"
          aria-label={t('header.theme.toggle', { ns: 'navigation', defaultValue: 'Toggle theme' })}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 transition-transform rotate-0" />
          ) : (
            <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 transition-transform rotate-0" />
          )}
        </Button>

        {/* Clinician Profile Chip */}
        <div className="hidden sm:flex items-center space-x-2 pl-1.5 sm:pl-2 border-l border-border">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground">
              {t('header.profile.doctorName', { ns: 'navigation' })}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {t('header.profile.bmdcNumber', { ns: 'navigation' })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
