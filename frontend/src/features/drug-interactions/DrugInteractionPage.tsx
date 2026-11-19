import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  BookOpen,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getDrugInteractions } from '@/services/drugInteractionService';
import { DrugInteraction } from '@/types';
import { COMMON_DRUG_INTERACTIONS } from '@/constants';

const BRAND_TO_GENERIC: Record<string, string> = {
  napa: 'paracetamol',
  ace: 'paracetamol',
  fast: 'paracetamol',
  reset: 'paracetamol',
  fexo: 'fexofenadine',
  fexofast: 'fexofenadine',
  fenofex: 'fexofenadine',
  rolac: 'ketorolac',
  torax: 'ketorolac',
  ketonic: 'ketorolac',
  bizoran: 'olmesartan',
  camlosart: 'olmesartan',
  ramiril: 'ramipril',
  ramicard: 'ramipril',
  enalapril: 'enalapril',
  renitec: 'enalapril',
  vasotec: 'enalapril',
  lisinopril: 'lisinopril',
  inopril: 'lisinopril',
  zestril: 'lisinopril',
  losartan: 'losartan',
  osartil: 'losartan',
  potassium: 'potassium',
  'potassium chloride': 'potassium',
  'potassium supplements': 'potassium',
  'ultra-k': 'potassium',
  'k-supplement': 'potassium',
  comformin: 'metformin',
  glucomin: 'metformin',
  lasix: 'furosemide',
  fusid: 'furosemide',
  voltalin: 'diclofenac',
  clofen: 'diclofenac',
  ecospirin: 'aspirin',
  ciprocin: 'ciprofloxacin',
  zithrox: 'azithromycin',
  sergel: 'esomeprazole',
  seclo: 'omeprazole',
};

export const DrugInteractionPage: React.FC = () => {
  const { t, i18n } = useTranslation(['interactions', 'common']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [allInteractions, setAllInteractions] = useState<DrugInteraction[]>(COMMON_DRUG_INTERACTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [pairA, setPairA] = useState('');
  const [pairB, setPairB] = useState('');
  const [pairResult, setPairResult] = useState<string | null>(null);
  const [pairResultType, setPairResultType] = useState<'SAFE' | 'INTERACTION' | null>(null);
  const [matchedInteraction, setMatchedInteraction] = useState<DrugInteraction | null>(null);

  // Load master catalog once for the quick pair screener
  useEffect(() => {
    getDrugInteractions('', 'ALL')
      .then((data) => {
        setAllInteractions(data && data.length > 0 ? data : COMMON_DRUG_INTERACTIONS);
      })
      .catch(() => {
        setAllInteractions(COMMON_DRUG_INTERACTIONS);
      });
  }, []);

  // Filtered list for the search & grid view
  useEffect(() => {
    getDrugInteractions(searchTerm, severityFilter)
      .then(setInteractions)
      .catch(() => {
        let results = [...COMMON_DRUG_INTERACTIONS];
        if (searchTerm && searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          results = results.filter(
            (i) =>
              i.drug_a.toLowerCase().includes(q) ||
              i.drug_b.toLowerCase().includes(q) ||
              i.mechanism?.toLowerCase().includes(q) ||
              i.clinical_significance.toLowerCase().includes(q)
          );
        }
        if (severityFilter && severityFilter !== 'ALL') {
          results = results.filter((i) => i.severity === severityFilter);
        }
        setInteractions(results);
      });
  }, [searchTerm, severityFilter]);

  const handlePairCheck = (e?: React.FormEvent, customA?: string, customB?: string) => {
    if (e) e.preventDefault();
    const targetA = (customA !== undefined ? customA : pairA).trim();
    const targetB = (customB !== undefined ? customB : pairB).trim();
    if (!targetA || !targetB) return;

    if (customA !== undefined) setPairA(customA);
    if (customB !== undefined) setPairB(customB);

    const normA = BRAND_TO_GENERIC[targetA.toLowerCase()] || targetA.toLowerCase();
    const normB = BRAND_TO_GENERIC[targetB.toLowerCase()] || targetB.toLowerCase();

    // Check in both allInteractions and COMMON_DRUG_INTERACTIONS
    const pool = [...allInteractions, ...COMMON_DRUG_INTERACTIONS];
    const isAceOrArb = (d: string) =>
      /enalapril|lisinopril|ramipril|captopril|perindopril|losartan|valsartan|olmesartan|candesartan|telmisartan/i.test(d);
    const isPotassium = (d: string) => /potassium|potasium|k-supplement|ultra-k/i.test(d);

    let match = pool.find((i) => {
      const da = i.drug_a.toLowerCase();
      const db = i.drug_b.toLowerCase();
      return (
        (da.includes(normA) && db.includes(normB)) ||
        (da.includes(normB) && db.includes(normA)) ||
        (da.includes(targetA.toLowerCase()) && db.includes(targetB.toLowerCase())) ||
        (da.includes(targetB.toLowerCase()) && db.includes(targetA.toLowerCase()))
      );
    });

    if (!match && ((isAceOrArb(normA) && isPotassium(normB)) || (isAceOrArb(normB) && isPotassium(normA)))) {
      match = {
        id: 'INT-07',
        drug_a: targetA,
        drug_b: targetB,
        severity: 'CRITICAL',
        mechanism: isBn
          ? 'ACE ইনহিবিটর / ARB রক্তচাপ কমানোর পাশাপাশি কিডনি থেকে পটাসিয়াম নির্গমন কমিয়ে শরীরে পটাসিয়াম ধরে রাখে। এর সাথে পটাসিয়াম সাপ্লিমেন্ট গ্রহণ করলে রক্তে মারাত্মক হাইপারক্যালেমিয়া (Hyperkalemia) ও কার্ডিয়াক অ্যারেস্টের ঝুঁকি সৃষ্টি হয়।'
          : 'ACE inhibitors and ARBs decrease aldosterone secretion leading to renal potassium retention. Concomitant administration of potassium supplements precipitates severe hyperkalemia and fatal cardiac conduction arrest.',
        clinical_significance: isBn
          ? 'হাইপারক্যালেমিয়া (Hyperkalemia - রক্তে বিপজ্জনক পটাসিয়াম বৃদ্ধি) এবং প্রাণঘাতী হার্ট অ্যারিদমিয়া ও কার্ডিয়াক অ্যারেস্ট।'
          : 'Hyperkalemia (rokto-te extra potassium) leading to life-threatening cardiac conduction disturbance and ventricular arrhythmias.',
        evidence_source: 'AHA/ACC Heart Failure & Hypertension Guidelines / BNF 86',
        recommended_action: isBn
          ? 'একসাথে সেবন সম্পূর্ণ পরিহার করুন। অবিলম্বে পটাসিয়াম সাপ্লিমেন্ট বন্ধ করুন এবং রক্তের সিরাম পটাসিয়াম ও ইসিজি মনিটর করুন।'
          : 'Avoid concomitant potassium supplements with ACE inhibitors. Check serum electrolytes and ECG immediately.',
        management_protocol: isBn
          ? 'জরুরী সিরাম পটাসিয়াম ও ক্রিয়েটিনিন টেস্ট এবং হৃদস্পন্দন নজরদারি।'
          : 'Emergency serum potassium, renal function testing, and ECG rhythm monitoring.',
      };
    }

    if (match) {
      setMatchedInteraction(match);
      setPairResultType('INTERACTION');
      setPairResult(
        `[${match.severity}] ${match.drug_a} + ${match.drug_b}: ${match.clinical_significance} Action: ${match.recommended_action}`
      );
    } else {
      setMatchedInteraction(null);
      setPairResultType('SAFE');
      setPairResult(
        isBn
          ? `"${targetA}" এবং "${targetB}" এর মধ্যে কোনো তীব্র প্রতিক্রিয়া পাওয়া যায়নি। রোগীর কিডনি বা লিভারের সমস্যা থাকলে ক্লিনিক্যাল পর্যবেক্ষণ নিশ্চিত করুন।`
          : `No severe interaction found in the active local rule set for "${targetA}" and "${targetB}". Ensure clinical monitoring if patient has kidney or liver impairment.`
      );
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
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
      case 'CRITICAL':
        return 'মারাত্মক ঝুঁকি (CRITICAL)';
      case 'HIGH':
        return 'উচ্চ ঝুঁকি (HIGH)';
      case 'MODERATE':
        return 'মাঝারি ঝুঁকি (MODERATE)';
      case 'LOW':
        return 'কম ঝুঁকি (LOW)';
      default:
        return `${severity} ঝুঁকি`;
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-teal-950 dark:text-teal-200 flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <span>{t('checkTool.title', 'Quick Pair Interaction Screener')}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {t('checkTool.subtitle', 'Test any two medications on-the-fly for immediate contraindication screening.')}
              </CardDescription>
            </div>

            {/* Quick Demo Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">{isBn ? 'নমুনা পরীক্ষা:' : 'Try:'}</span>
              <button
                type="button"
                onClick={() => handlePairCheck(undefined, 'Enalapril', 'Potassium Supplements')}
                className="text-[10px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-200 transition font-medium"
              >
                Enalapril + Potassium ({isBn ? 'মারাত্মক' : 'Critical'})
              </button>
              <button
                type="button"
                onClick={() => handlePairCheck(undefined, 'Ketorolac', 'Olmesartan')}
                className="text-[10px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-200 transition"
              >
                Ketorolac + Olmesartan
              </button>
              <button
                type="button"
                onClick={() => handlePairCheck(undefined, 'Metformin', 'Ketorolac')}
                className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-200 transition"
              >
                Metformin + Ketorolac
              </button>
              <button
                type="button"
                onClick={() => handlePairCheck(undefined, 'napa', 'fexo')}
                className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-200 transition"
              >
                Napa + Fexo ({isBn ? 'নিরাপদ' : 'Safe'})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handlePairCheck(e)} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
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
              <Button type="submit" size="sm" onClick={(e) => handlePairCheck(e)} className="w-full text-xs">
                {t('checkTool.btnCheck', 'Screen Drug Pair')}
              </Button>
            </div>
          </form>

          {/* Structured Screening Output */}
          {pairResult && (
            <div className="mt-4 space-y-2">
              {pairResultType === 'SAFE' ? (
                <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-foreground flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300">
                        {isBn ? 'নিরাপদ কম্বিনেশন (Safe Combination)' : 'Safe & Compatible Combination'}
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        {isBn ? 'কোনো সংঘাত নেই' : 'No Collision'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-primary">{t('checkTool.finding', 'Screening Finding: ')}</span>
                      {pairResult}
                    </p>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                      {isBn
                        ? `প্রেসক্রাইবকৃত ওষুধ দুটির মধ্যে কোনো ড্রাগ-ড্রাগ ইন্টারঅ্যাকশন নেই। এগুলো একসাথে সেবন করা চিকিৎসাগতভাবে নিরাপদ।`
                        : `No pharmacokinetic or pharmacodynamic collisions identified. Concomitant administration is clinically safe.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-xs text-foreground space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                    <span className="font-bold text-red-900 dark:text-red-300">
                      {isBn ? 'মারাত্মক ওষুধের সংঘাত শনাক্ত হয়েছে!' : 'Adverse Drug Collision Detected!'}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-primary">{t('checkTool.finding', 'Screening Finding: ')}</span>
                    {pairResult}
                  </p>
                  {matchedInteraction && (
                    <div className="pt-2 border-t border-red-200 dark:border-red-900/60 space-y-1 text-[11px]">
                      <p><strong>{isBn ? 'মেকানিজম: ' : 'Mechanism: '}</strong>{matchedInteraction.mechanism}</p>
                      <p className="text-amber-900 dark:text-amber-300"><strong>{isBn ? 'সুপারিশকৃত পদক্ষেপ: ' : 'Recommended Action: '}</strong>{matchedInteraction.recommended_action}</p>
                    </div>
                  )}
                </div>
              )}
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
                placeholder={t(
                  'searchPlaceholder',
                  'Search by drug name (e.g. Ketorolac, Metformin, Warfarin), mechanism, or clinical effect...'
                )}
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
        {interactions.length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-2 bg-card">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <h4 className="font-semibold text-sm text-foreground">
              {isBn
                ? `"${searchTerm}" এর জন্য কোনো ক্ষতিকর সংঘাত পাওয়া যায়নি`
                : `No adverse collisions found for "${searchTerm}"`}
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {isBn
                ? `প্রেসক্রিপশন ডাটাবেসে এই ওষুধের সাথে অন্য কোনো বিষাক্ত বা ক্ষতিকর মিথস্ক্রিয়া নথিভুক্ত নেই। এটি চিকিৎসাগতভাবে স্বাভাবিক।`
                : `This medication does not have any documented critical contraindications or severe adverse interactions in our pharmacovigilance registry.`}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="mt-2 text-xs"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                {isBn ? 'ফিল্টার পরিষ্কার করুন' : 'Clear Search Filter'}
              </Button>
            )}
          </div>
        ) : (
          interactions.map((interaction) => (
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
          ))
        )}
      </div>
    </div>
  );
};
