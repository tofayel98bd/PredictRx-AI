import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Info,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getDrugInteractions } from '@/services/drugInteractionService';
import { DrugInteraction } from '@/types';

export const DrugInteractionPage: React.FC = () => {
  const { t, i18n } = useTranslation(['interactions', 'common']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [pairA, setPairA] = useState('');
  const [pairB, setPairB] = useState('');
  const [pairResult, setPairResult] = useState<string | null>(null);

  useEffect(() => {
    getDrugInteractions(searchTerm, severityFilter).then(setInteractions);
  }, [searchTerm, severityFilter]);

  const handlePairCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairA || !pairB) return;
    const qA = pairA.toLowerCase();
    const qB = pairB.toLowerCase();

    const match = interactions.find(
      (i) =>
        (i.drug_a.toLowerCase().includes(qA) && i.drug_b.toLowerCase().includes(qB)) ||
        (i.drug_a.toLowerCase().includes(qB) && i.drug_b.toLowerCase().includes(qA))
    );

    if (match) {
      setPairResult(
        `[${match.severity}] ${match.drug_a} + ${match.drug_b}: ${match.clinical_significance} Action: ${match.recommended_action}`
      );
    } else {
      setPairResult(
        isBn
          ? `"${pairA}" এবং "${pairB}" এর মধ্যে কোনো তীব্র প্রতিক্রিয়া পাওয়া যায়নি। রোগীর কিডনি বা লিভারের সমস্যা থাকলে ক্লিনিক্যাল পর্যবেক্ষণ নিশ্চিত করুন।`
          : `No severe interaction found in the active local rule set for "${pairA}" and "${pairB}". Ensure clinical monitoring if patient has kidney or liver impairment.`
      );
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'critical';
      case 'HIGH':
        return 'critical';
      case 'MODERATE':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'info';
    }
  };

  const formatSeverityLabel = (severity: string) => {
    if (!isBn) return `${severity} SEVERITY`;
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'মারাত্মক ঝুঁকি (CRITICAL)';
      case 'HIGH': return 'উচ্চ ঝুঁকি (HIGH)';
      case 'MODERATE': return 'মাঝারি ঝুঁকি (MODERATE)';
      case 'LOW': return 'কম ঝুঁকি (LOW)';
      default: return `${severity} ঝুঁকি`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <span>{t('title', 'Drug Interaction Monitoring Center')}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'subtitle',
              'Traceable pharmacokinetic and pharmacodynamic drug-drug collision database aligned with Bangladesh Formulary & international guidelines.'
            )}
          </p>
        </div>
      </div>

      {/* Quick Pair Interaction Tester */}
      <Card className="border-teal-300 dark:border-teal-900 bg-teal-50/20 dark:bg-teal-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-teal-950 dark:text-teal-200 flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span>{t('checkTool.title', 'Quick Pair Interaction Screener')}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t('checkTool.subtitle', 'Test any two medications on-the-fly for immediate contraindication screening.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePairCheck} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <Input
                placeholder={t('checkTool.drugAPlaceholder', 'Drug A (e.g. Ketorolac / Rolac)')}
                value={pairA}
                onChange={(e) => setPairA(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="sm:col-span-4">
              <Input
                placeholder={t('checkTool.drugBPlaceholder', 'Drug B (e.g. Olmesartan / Bizoran)')}
                value={pairB}
                onChange={(e) => setPairB(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="sm:col-span-4">
              <Button type="submit" size="sm" className="w-full text-xs">
                {t('checkTool.btnCheck', 'Screen Drug Pair')}
              </Button>
            </div>
          </form>

          {pairResult && (
            <div className="mt-3 p-3 rounded-lg border border-border bg-card text-xs text-foreground leading-relaxed">
              <span className="font-semibold text-primary">{t('checkTool.finding', 'Screening Finding: ')}</span>
              {pairResult}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder', 'Search by drug name (e.g. Ketorolac, Metformin, Warfarin), mechanism, or clinical effect...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="ALL">{t('filter.all', 'All Severities')}</option>
                <option value="CRITICAL">{t('filter.critical', 'Critical Severity')}</option>
                <option value="HIGH">{t('filter.high', 'High Severity')}</option>
                <option value="MODERATE">{t('filter.moderate', 'Moderate Severity')}</option>
                <option value="LOW">{t('filter.low', 'Low Severity')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactions Cards Grid */}
      <div className="space-y-4">
        {interactions.map((interaction) => (
          <Card key={interaction.id} className="border-border shadow-sm hover:border-primary/40 transition">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base text-foreground">
                    {interaction.drug_a}
                  </span>
                  <span className="text-muted-foreground font-mono">⟷</span>
                  <span className="font-bold text-base text-foreground">
                    {interaction.drug_b}
                  </span>
                </div>

                <Badge variant={getSeverityBadge(interaction.severity)} className="text-xs">
                  {formatSeverityLabel(interaction.severity)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              {interaction.mechanism && (
                <div>
                  <span className="font-semibold text-foreground">{t('card.mechanism', 'Pharmacodynamic Mechanism:')}</span>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">{interaction.mechanism}</p>
                </div>
              )}

              <div>
                <span className="font-semibold text-red-700 dark:text-red-400">{t('card.significance', 'Clinical Significance:')}</span>
                <p className="text-foreground mt-0.5 leading-relaxed">{interaction.clinical_significance}</p>
              </div>

              <div className="p-3 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 text-teal-950 dark:text-teal-200">
                <span className="font-semibold">{t('card.recommendedAction', 'Recommended Clinician Action: ')}</span>
                <span>{interaction.recommended_action}</span>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  <span>{t('card.evidence', 'Evidence:')} {interaction.evidence_source}</span>
                </span>
                <span className="font-mono text-[10px]">{t('card.ruleId', 'Rule ID:')} {interaction.id}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
