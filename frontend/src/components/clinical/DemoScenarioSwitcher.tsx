import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, AlertOctagon, User, ArrowRight, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GOLDEN_DEMO_SCENARIOS, GoldenDemoScenario } from '@/constants';

interface DemoScenarioSwitcherProps {
  activeScenarioId?: string | null;
  onSelectScenario: (scenario: GoldenDemoScenario, instantRun?: boolean) => void;
  isLoading?: boolean;
}

export const DemoScenarioSwitcher: React.FC<DemoScenarioSwitcherProps> = ({
  activeScenarioId,
  onSelectScenario,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation(['analysis', 'common']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));

  const getBadgeText = (badge: string) => {
    if (!isBn) return badge;
    return badge
      .replace('86% AKI RISK', '৮৬% AKI ঝুঁকি')
      .replace('78% COLLAPSE RISK', '৭৮% কলাপস ঝুঁকি')
      .replace("84% REYE'S SYNDROME", '৮৪% রে সিন্ড্রোম')
      .replace('32% NEURO-GERIATRIC', '৩২% নিউরো-জেরিয়াট্রিক')
      .replace('48% STAGE 4 CKD', '৪৮% স্টেজ ৪ সিকেডি');
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span>{t('scenarios.title', isBn ? 'ক্লিনিক্যাল রেফারেন্স কেস স্টাডি' : 'Clinical Reference Case Scenarios')}</span>
            </h3>
          </div>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline-block">
          {t('scenarios.subtitle', isBn ? 'নমুনা কেস নির্বাচন করে তাৎক্ষণিক মূল্যায়ন পরীক্ষা করুন' : 'Select any reference case to preload sample clinical profile')}
        </span>
      </div>

      <div className="w-full min-w-0 overflow-x-auto pb-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 min-w-0">
          {GOLDEN_DEMO_SCENARIOS.map((scenario) => {
            const isActive = activeScenarioId === scenario.scenario_id;

            return (
              <Card
                key={scenario.id}
                className={`min-w-0 w-full overflow-hidden relative flex flex-col justify-between p-3 transition-all duration-200 border ${
                  isActive
                    ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/30 dark:bg-teal-950/20 shadow-sm'
                    : 'border-border/80 hover:border-teal-400/60 hover:bg-muted/30'
                }`}
              >
                <div className="min-w-0">
                  {/* Header row: Title & Risk badge */}
                  <div className="flex items-start justify-between gap-1.5 mb-1.5 min-w-0">
                    <div className="flex items-center space-x-1 min-w-0 flex-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[11px] font-bold text-foreground truncate" title={scenario.title}>
                        {scenario.title}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[9px] font-bold tracking-tight px-1.5 py-0.5 bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 whitespace-nowrap"
                    >
                      <AlertOctagon className="h-2.5 w-2.5 mr-0.5 inline shrink-0" />
                      {getBadgeText(scenario.badge)}
                    </Badge>
                  </div>

                  {/* Subtitle / Prescription details */}
                  <p className="text-[10px] font-medium text-foreground/90 truncate mb-1" title={scenario.subtitle}>
                    {scenario.subtitle}
                  </p>

                  {/* Key clinical violation highlight */}
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mb-2.5">
                    {scenario.highlight}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-1.5">
                  <Button
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    aria-label={`Autofill ${scenario.title}`}
                    disabled={isLoading}
                    onClick={() => onSelectScenario(scenario, false)}
                    className={`h-7 px-1 text-[11px] font-medium w-full flex items-center justify-center truncate ${
                      isActive
                        ? 'bg-teal-700 hover:bg-teal-800 text-white'
                        : 'hover:border-teal-400 text-foreground'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="h-3 w-3 mr-0.5 text-white shrink-0" />
                        <span className="truncate">{t('scenarios.loaded', 'Loaded')}</span>
                      </>
                    ) : (
                      <span className="truncate">{t('scenarios.autofill', 'Autofill')}</span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Instant Run ${scenario.title}`}
                    disabled={isLoading}
                    onClick={() => onSelectScenario(scenario, true)}
                    className="h-7 px-1 text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 flex items-center justify-center space-x-1 w-full truncate"
                    title="Run instant analysis in < 15ms"
                  >
                    <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0 fill-amber-500" />
                    <span className="truncate">{t('scenarios.instantRun', 'Instant Run')}</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
