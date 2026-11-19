import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import { ShapContribution } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ShapChartProps {
  features: ShapContribution[];
  isDemo?: boolean;
}

export const ShapWaterfallChart: React.FC<ShapChartProps> = ({ features, isDemo = true }) => {
  const { t, i18n } = useTranslation(['analysis', 'common']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));

  const translateFeature = (name: string) => {
    if (!isBn) return name;
    const featureMap: Record<string, string> = {
      'Ketorolac Duration (14 days vs 5 day limit)': 'Ketorolac গ্রহণের মেয়াদ (৫ দিনের বিপরীতে ১৪ দিন)',
      'Baseline eGFR (34.5 mL/min/1.73m²)': 'বেসলাইন eGFR (34.5 mL/min/1.73m²)',
      'ARB + NSAID Interaction': 'ARB + NSAID মিথস্ক্রিয়া',
      'Controlled Statin Therapy': 'নিয়ন্ত্রিত স্ট্যাটিন থেরাপি',
      'Patient Age (62 years)': 'রোগীর বয়স (৬২ বছর)',
      'Triple Whammy Collision (ACEi + Diuretic + NSAID)': 'ট্রিপল হোয়ামি তীব্র ঝুঁকি (ACEi + Diuretic + NSAID)',
      'Moderate Renal Impairment (eGFR 52 mL/min)': 'মাঝারি কিডনি বৈকল্য (eGFR 52 mL/min)',
      'Pediatric Age Vulnerability (8 Years)': 'শিশুর বয়স সংক্রান্ত ঝুঁকি (৮ বছর)',
      'Inappropriate Salicylate Exposure': 'অনুপযুক্ত স্যালিসিলেট সেবন',
    };
    return featureMap[name] || name;
  };

  const translateExplanation = (exp: string) => {
    if (!isBn) return exp;
    const expMap: Record<string, string> = {
      'Excess course duration is the primary driver of catastrophic nephrotoxic and peptic ulcer risk.': 'অতিরিক্ত সময় ওষুধ ব্যবহারের ফলে মারাত্মক নেফ্রোটক্সিক এবং পেপটিক আলসারের চরম ঝুঁকি তৈরি হয়।',
      'Stage 3b CKD leaves virtually no functional renal reserve to absorb prostaglandin inhibition.': 'স্টেজ 3b CKD থাকার কারণে প্রোস্টাগ্ল্যান্ডিন বাধা শোষণ করার মতো কিডনির কোনো কার্যকরী সক্ষমতা অবশিষ্ট থাকে না।',
      'Dual assault on renal perfusion: ARB impairs efferent tone while NSAID blocks afferent prostaglandins.': 'কিডনির রক্ত সঞ্চালনে দ্বৈত আঘাত: ARB ইফারেন্ট টোন ব্যাহত করে এবং NSAID অ্যাফারেন্ট প্রোস্টাগ্ল্যান্ডিন ব্লক করে।',
      'Long-term statin use stabilizes vascular endothelium, providing minor systemic protective buffering.': 'দীর্ঘমেয়াদী স্ট্যাটিন ব্যবহার ভাস্কুলার এন্ডোথেলিয়াম স্থিতিশীল রাখে, যা সামান্য পদ্ধতিগত সুরক্ষামূলক বাফার প্রদান করে।',
      'Moderate geriatric vulnerability increases susceptibility to acute toxic nephropathy.': 'বয়োবৃদ্ধির কারণে তীব্র বিষাক্ত নেফ্রোপ্যাথি হওয়ার সংবেদনশীলতা বৃদ্ধি পায়।',
      'Simultaneous afferent vasoconstriction, efferent vasodilation, and volume contraction causes acute GFR collapse.': 'একই সাথে অ্যাফারেন্ট ভাসোকনস্ট্রিকশন, ইফারেন্ট ভাসোডিলেশন এবং তরল হ্রাস কিডনির কার্যক্ষমতায় তীব্র পতন ঘটায়।',
      'Reduced baseline nephron clearance diminishes renal reserve.': 'হ্রাসপ্রাপ্ত কিডনি ক্লিয়ারেন্স রেনাল রিজার্ভ কমিয়ে দেয়।',
      'Immature hepatic mitochondrial clearance makes salicylates lethal during viral infection.': 'অপূর্ণাঙ্গ লিভার কার্যক্ষমতার কারণে ভাইরাল সংক্রমণের সময় স্যালিসিলেট মারাত্মক বিপজ্জনক রূপ নেয়।',
      "Aspirin during viral flu triggers Reye's syndrome with acute encephalopathy.": "ভাইরাল ফ্লুর সময় অ্যাসপিরিন তীব্র এনসেফালোপ্যাথি সহ রে সিন্ড্রোম সৃষ্টি করতে পারে।",
    };
    return expMap[exp] || exp;
  };

  const translateCategory = (cat: string) => {
    if (!isBn) return cat;
    const catMap: Record<string, string> = {
      'Duration': 'সময়সীমা',
      'Renal': 'কিডনি সংক্রান্ত',
      'Interaction': 'ওষুধের পারস্পরিক ক্রিয়া',
      'Protective': 'সুরক্ষামূলক',
      'Age': 'বয়স',
      'Dosage': 'ডোজের মাত্রা',
    };
    return catMap[cat] || cat;
  };

  // Sort descending by magnitude of impact
  const sortedData = [...features].sort((a, b) => Math.abs(b.impact_score) - Math.abs(a.impact_score));

  const chartData = sortedData.map((f) => ({
    name: translateFeature(f.feature),
    originalName: f.feature,
    score: Number((f.impact_score * 100).toFixed(1)),
    category: f.category,
    rawScore: f.impact_score,
    explanation: translateExplanation(f.clinical_explanation),
    value: f.value,
  }));

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <CardTitle className="text-base font-bold">
                {t('results.shap.title', 'Explainable AI (XAI): SHAP Risk Factor Contributions')}
              </CardTitle>
              <Badge variant="outline" className="border-teal-500/30 text-teal-600 dark:text-teal-400 font-mono text-[10px]">
                XAI Layer
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              {t('results.shap.subtitle', 'Shapley Additive Explanations decompose the overall adverse clinical risk into patient-specific factor weights.')}
            </CardDescription>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1">
              <span className="h-3 w-3 rounded bg-red-500" />
              <span className="text-muted-foreground">{t('results.shap.increasesRisk', 'Increases Risk (+)')}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-3 w-3 rounded bg-emerald-600" />
              <span className="text-muted-foreground">{t('results.shap.protective', 'Protective / Dampener (-)')}</span>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Recharts Bar Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                type="number"
                domain={[-40, 50]}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={200}
                fontSize={11}
                tick={{ fill: 'currentColor', opacity: 0.8 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const isPositive = data.rawScore > 0;
                    return (
                      <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs max-w-xs">
                        <p className="font-bold text-foreground">{data.name}</p>
                        <p className="text-muted-foreground mt-0.5">
                          {t('results.shap.value', 'Value:')} <span className="font-medium text-foreground">{String(data.value)}</span>
                        </p>
                        <div className="my-1.5 flex items-center space-x-1.5 font-semibold">
                          <span>{t('results.shap.riskShift', 'Risk Shift:')}</span>
                          <span className={isPositive ? 'text-red-600' : 'text-emerald-600'}>
                            {isPositive
                              ? (isBn ? `+${data.score}% প্রতিকূল ঝুঁকি বৃদ্ধি` : `+${data.score}% adverse risk contribution`)
                              : (isBn ? `${data.score}% ঝুঁকি প্রশমন` : `${data.score}% risk attenuation`)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 border-t border-border pt-1">
                          {data.explanation}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Bar dataKey="score" radius={[4, 4, 4, 4]} barSize={18}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.rawScore > 0 ? '#ef4444' : '#059669'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Explainability Breakdown Cards */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('results.shap.breakdownHeader', 'Clinician Factor Interpretability Breakdown')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{translateFeature(f.feature)}</span>
                    <Badge
                      variant={f.impact_score > 0 ? 'critical' : 'success'}
                      className="text-[10px] font-mono"
                    >
                      {f.impact_score > 0
                        ? (isBn ? `+${(f.impact_score * 100).toFixed(0)}% ঝুঁকি` : `+${(f.impact_score * 100).toFixed(0)}% Risk`)
                        : (isBn ? `${(f.impact_score * 100).toFixed(0)}% সুরক্ষা` : `${(f.impact_score * 100).toFixed(0)}% Shield`)}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    {translateExplanation(f.clinical_explanation)}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{t('results.shap.category', 'Category:')} {translateCategory(f.category)}</span>
                  <span>{t('results.shap.observed', 'Observed:')} <strong className="text-foreground">{String(f.value)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Interpretation Guide */}
        <div className="p-3 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 text-xs">
          <div className="flex items-start space-x-2.5">
            <HelpCircle className="h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-teal-950 dark:text-teal-200">
                {t('results.shap.guideTitle', 'Understanding SHAP Values in Clinical Practice')}
              </p>
              <p className="text-[11px] text-teal-900/80 dark:text-teal-300/80 mt-0.5 leading-relaxed">
                {t('results.shap.guideDesc', "SHAP values quantify each patient variable's contribution relative to baseline cohort incidence. Red bars represent risk escalators (such as off-label duration or acute renal impairment), whereas green bars represent stabilizing baseline buffers.")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
