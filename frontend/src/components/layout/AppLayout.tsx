import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MEDICAL_SAFETY_DISCLAIMER } from '@/constants';
import { ShieldCheck, Info } from 'lucide-react';

export const AppLayout: React.FC = () => {
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav onOpenMobile={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Global Medical Safety Disclaimer Bar */}
        <footer className="no-print border-t border-border bg-card/95 px-4 py-2 text-xs text-muted-foreground backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
            <div className="flex items-center space-x-1.5 text-[11px] text-amber-800 dark:text-amber-300">
              <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>{MEDICAL_SAFETY_DISCLAIMER}</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-muted-foreground shrink-0">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="h-3 w-3 text-primary" />
                <span>CDSS Protocol v1.4</span>
              </span>
              <span>•</span>
              <span>Bangladesh Pharmacovigilance Alignment</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
