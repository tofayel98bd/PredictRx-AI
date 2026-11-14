import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkBackendHealth } from '@/services/apiClient';

interface TopNavProps {
  onOpenMobile: () => void;
}

const pageTitles: Record<string, { title: string; category: string }> = {
  '/dashboard': { title: 'Clinical Overview Dashboard', category: 'Executive Monitoring' },
  '/analyze': { title: 'Prescription OCR & Safety Analysis', category: 'Diagnostic AI' },
  '/prescriptions': { title: 'Prescription Records & History', category: 'Clinical Records' },
  '/patients': { title: 'Patient Directory & Safety Profiles', category: 'Patient Care' },
  '/drug-interactions': { title: 'Drug Interaction Monitoring Center', category: 'Pharmacovigilance' },
  '/risk-analysis': { title: 'Explainable Clinical Risk & SHAP Analysis', category: 'AI Intelligence' },
  '/reports': { title: 'Verified Clinical Decision Reports', category: 'Documentation' },
  '/bangla-companion': { title: 'Bangla Patient Companion (সহজ বাংলা নির্দেশিকা)', category: 'Patient Literacy' },
  '/settings': { title: 'System Configuration & Safety Settings', category: 'Preferences' },
};

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobile }) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
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
  const pageInfo = pageTitles[pathBase] || { title: 'Clinical Decision Support', category: 'PredictRx-AI' };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile trigger & Page title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground lg:hidden hover:bg-muted"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>{pageInfo.category}</span>
            <span>/</span>
            <span className="font-medium text-foreground">{pageInfo.title.split(' ')[0]}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Right controls: Backend Status, Notifications, Theme, Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* API Connection Indicator */}
        <div
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs border font-medium cursor-default"
          title={backendStatus.message}
        >
          {backendStatus.online ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 dark:text-emerald-400">FastAPI Live</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-blue-700 dark:text-blue-300">Safe Demo Adapter</span>
            </>
          )}
        </div>

        {/* Clinical Alert Notification Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
            aria-label="Clinical safety notifications"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </Button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-sm">Critical Clinical Alerts</span>
                </div>
                <Badge variant="critical">2 Unreviewed</Badge>
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
                        High AKI Risk: Ketorolac 14d + Olmesartan
                      </p>
                      <p className="text-[11px] text-red-700/80 dark:text-red-400 mt-0.5">
                        Patient: Md. Rafiqul Islam (CKD 3a, eGFR 34.5)
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/30">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                        Therapeutic Ceiling Warning
                      </p>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                        Ketorolac protocol ceiling is 5 days maximum.
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
                  View Pharmacovigilance Monitor →
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
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400 transition-transform rotate-0" />
          ) : (
            <Moon className="h-5 w-5 text-slate-700 transition-transform rotate-0" />
          )}
        </Button>

        {/* Clinician Profile Chip */}
        <div className="flex items-center space-x-2 pl-2 border-l border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground">Dr. M. Ashraful Hoque</span>
            <span className="text-[10px] text-muted-foreground">BMDC #A-89412</span>
          </div>
        </div>
      </div>
    </header>
  );
};
