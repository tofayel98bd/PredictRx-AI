import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MEDICAL_SAFETY_DISCLAIMER } from '@/constants';
import { ShieldCheck, Info } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { t } = useTranslation('common');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopNav onOpenMobile={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Global Medical Safety Disclaimer Bar */}
        <footer className="no-print border-t border-border bg-card/95 px-3 py-1.5 sm:py-2 text-xs text-muted-foreground backdrop-blur-sm shrink-0">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left text-[10px] sm:text-[11px]">
            <div className="flex items-center space-x-1.5 text-amber-800 dark:text-amber-300">
              <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="leading-tight">
                {t(
                  'safetyDisclaimer',
                  'PredictRx-AI is a clinical decision support tool. It does not replace professional medical judgment. All clinical decisions must be reviewed by a qualified healthcare professional.'
                )}
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-[10px] text-muted-foreground shrink-0">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="h-3 w-3 text-primary" />
                <span>{t('footer.protocol', 'CDSS Protocol v1.4')}</span>
              </span>
              <span>•</span>
              <span>{t('footer.alignment', 'Bangladesh Pharmacovigilance Alignment')}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
