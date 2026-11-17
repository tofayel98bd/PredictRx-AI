import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileSearch,
  History,
  Users,
  ShieldAlert,
  Activity,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  AlertTriangle,
  HeartHandshake,
  Presentation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { t, i18n } = useTranslation(['navigation', 'common']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));

  const navItems = [
    {
      name: t('sidebar.dashboard', { ns: 'navigation', defaultValue: 'Dashboard' }),
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: t('sidebar.analyze', { ns: 'navigation', defaultValue: 'Analyze Prescription' }),
      path: '/analyze',
      icon: FileSearch,
      highlight: true,
    },
    {
      name: t('sidebar.prescriptions', { ns: 'navigation', defaultValue: 'Prescription Records' }),
      path: '/prescriptions',
      icon: History,
    },
    {
      name: t('sidebar.patients', { ns: 'navigation', defaultValue: 'Patient Directory' }),
      path: '/patients',
      icon: Users,
    },
    {
      name: t('sidebar.drugInteractions', { ns: 'navigation', defaultValue: 'Drug Interactions' }),
      path: '/drug-interactions',
      icon: ShieldAlert,
    },
    {
      name: t('sidebar.clinicalRisk', { ns: 'navigation', defaultValue: 'Clinical Risk Analysis' }),
      path: '/risk-analysis/AN-2026-0941',
      icon: Activity,
    },
    {
      name: t('sidebar.reports', { ns: 'navigation', defaultValue: 'Clinical Reports' }),
      path: '/reports/AN-2026-0941',
      icon: FileText,
    },
    {
      name: t('sidebar.banglaCompanion', { ns: 'navigation', defaultValue: 'Bangla Companion' }),
      path: '/bangla-companion',
      icon: HeartHandshake,
      badgeText: 'বাংলা',
    },
    {
      name: t('sidebar.pitchDeck', { ns: 'navigation', defaultValue: 'Pitch Deck (10-Slide)' }),
      path: '/pitch_deck.html',
      icon: Presentation,
      isExternal: true,
      badgeText: 'PITCH',
    },
    {
      name: t('sidebar.settings', { ns: 'navigation', defaultValue: 'System Settings' }),
      path: '/settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out lg:static',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-3.5 border-b border-border">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center space-x-1.5 whitespace-nowrap">
                  <span className="font-bold text-base tracking-tight text-foreground">
                    PredictRx
                  </span>
                  <span className="text-[11px] font-extrabold font-mono text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                    AI
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold truncate leading-tight mt-0.5">
                  {isBn ? 'ক্লিনিক্যাল ডিসিশন সাপোর্ট' : 'Clinical Decision Support'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            title={
              collapsed
                ? t('sidebar.expand', { ns: 'navigation', defaultValue: 'Expand sidebar' })
                : t('sidebar.collapse', { ns: 'navigation', defaultValue: 'Collapse sidebar' })
            }
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.isExternal) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onCloseMobile}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0 text-cyan-500', !collapsed && 'mr-3')} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                  {!collapsed && item.badgeText && (
                    <Badge variant="demo" className="ml-auto text-[10px] py-0 px-1.5 bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-400/40">
                      {item.badgeText}
                    </Badge>
                  )}
                </a>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )
                }
              >
                <Icon className={cn('h-5 w-5 shrink-0', !collapsed && 'mr-3')} />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {!collapsed && item.badgeText && (
                  <Badge variant="success" className="ml-auto text-[10px] py-0 px-1.5 font-bold">
                    {item.badgeText}
                  </Badge>
                )}
                {!collapsed && item.highlight && (
                  <Badge variant="demo" className="ml-auto text-[10px] py-0 px-1.5 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-400/40">
                    {t('status.active', { ns: 'common', defaultValue: 'Active' })}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Clinical Guardian Chip */}
        {!collapsed ? (
          <div className="p-3 border-t border-border bg-muted/30 m-3 rounded-lg">
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{t('safety.advisoryNotice', { ns: 'common', defaultValue: 'Advisory Notice' })}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
              {t('safety.advisoryDescription', {
                ns: 'common',
                defaultValue: 'Assists clinician evaluation. Never replaces qualified medical assessment.',
              })}
            </p>
          </div>
        ) : (
          <div
            className="p-2 border-t border-border flex justify-center text-amber-600"
            title={t('safety.advisoryNotice', { ns: 'common', defaultValue: 'Advisory Notice' })}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
        )}
      </aside>
    </>
  );
};
