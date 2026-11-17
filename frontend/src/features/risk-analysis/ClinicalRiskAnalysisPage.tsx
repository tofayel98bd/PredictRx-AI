import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  BookOpen,
  Info,
  HelpCircle,
  FileText,
  User,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RiskGaugeCard } from '@/components/clinical/RiskGaugeCard';
import { ShapWaterfallChart } from '@/components/clinical/ShapWaterfallChart';
import { getPrescriptionById } from '@/services/prescriptionService';
import { PrescriptionAnalysisResult } from '@/types';
import { DEMO_ANALYSIS_RESULT } from '@/constants';

export const ClinicalRiskAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation(['analysis', 'common']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));
  const [analysis, setAnalysis] = useState<PrescriptionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrescriptionById(id || 'AN-2026-0941')
      .then((data) => setAnalysis(data || DEMO_ANALYSIS_RESULT))
      .catch(() => setAnalysis(DEMO_ANALYSIS_RESULT))
      .finally(() => setLoading(false));
  }, [id]);

  const risk = analysis?.clinical_risk || DEMO_ANALYSIS_RESULT.clinical_risk;

  const translatePatientFactor = (factor: string) => {
    if (!isBn) return factor;
    const factorMap: Record<string, string> = {
      'eGFR 34.5 mL/min/1.73m² (CKD Stage 3b) restricts drug filtration capacity': 'eGFR 34.5 mL/min/1.73m² (CKD স্টেজ 3b) ওষুধের ফিল্ট্রেশন ক্ষমতা মারাত্মকভাবে কমিয়ে দেয়',
      'Concomitant ARB (Olmesartan) + high-dose NSAID creates acute renal hemodynamics failure': 'সহবর্তী ARB (Olmesartan) + উচ্চ মাত্রার NSAID তীব্র রেনাল হেমোডাইনামিক ব্যর্থতা তৈরি করে',
      'Age 62 presents increased vulnerability to NSAID-induced nephrotoxicity': 'বয়স ৬২ বছর হওয়ায় রোগীর NSAID-জনিত কিডনি জটিলতার ঝুঁকি বহুগুণ বৃদ্ধি পায়',
      '14-day Ketorolac course severely exceeds the maximum safe duration of 5 days': '১৪ দিনের Ketorolac সেবন সর্বোচ্চ নিরাপদ ৫ দিনের সময়সীমাকে মারাত্মকভাবে অতিক্রম করেছে',
    };
    return factorMap[factor] || factor;
  };

  const translateLimitation = (limitation: string) => {
    if (!isBn) return limitation;
    const limMap: Record<string, string> = {
      'Predictions are probabilistic estimations and require clinical judgment.': 'পূর্বাভাসগুলো সম্ভাব্য প্রাক্কলন মাত্র এবং রেজিস্ট্রার্ড চিকিৎসকের ক্লিনিক্যাল বিচার-বুদ্ধি আবশ্যক।',
      'SHAP values reflect local feature attribution, not strict biological causality.': 'SHAP মান রোগীর নির্দিষ্ট বৈশিষ্ট্যের আপেক্ষিক প্রভাব নির্দেশ করে, সরাসরি জৈবিক কার্যকারণ নয়।',
      'Model is calibrated on adult cohort data; use extreme caution in pediatric or geriatric extremes.': 'মডেলটি প্রাপ্তবয়স্কদের ক্লিনিক্যাল ডেটার ওপর ক্যালিব্রেট করা; শিশু ও অতি প্রবীণদের ক্ষেত্রে বিশেষ সতর্কতা অবলম্বন করুন।',
    };
    return limMap[limitation] || limitation;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link to="/prescriptions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {isBn ? 'ব্যাখ্যামূলক ক্লিনিক্যাল ঝুঁকি ও SHAP বিশ্লেষণ' : 'Explainable Clinical Risk & SHAP Analysis'}
              </h2>
              <Badge variant="demo">{isBn ? 'XAI স্তর' : 'XAI Layer'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isBn ? 'প্রেসক্রিপশন আইডি:' : 'Prescription ID:'}{' '}
              <span className="font-mono font-medium text-foreground">{analysis?.prescription_id}</span> •{' '}
              {isBn ? 'রোগী:' : 'Patient:'}{' '}
              <span className="font-medium text-foreground">{analysis?.patient_context.name}</span>{' '}
              ({isBn ? `বয়স ${analysis?.patient_context.age}` : `Age ${analysis?.patient_context.age}`})
            </p>
          </div>
        </div>

        <Button asChild size="sm" variant="outline">
          <Link to={`/reports/${analysis?.analysis_id}`}>
            <FileText className="mr-1.5 h-4 w-4" />
            {isBn ? 'সম্পূর্ণ ক্লিনিক্যাল রিপোর্ট দেখুন' : 'View Full Clinical Report'}
          </Link>
        </Button>
      </div>

      {/* Primary Risk Gauge & Sub-risks */}
      <RiskGaugeCard risk={risk} />

      {/* SHAP Waterfall Chart & Factor Breakdown */}
      <ShapWaterfallChart
        features={risk.shap_features}
        isDemo={risk.is_synthetic_demo}
      />

      {/* Patient Specific Factors vs Clinical Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Specific Factors */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <User className="h-4 w-4 text-primary" />
              <span>{isBn ? 'পর্যবেক্ষিত রোগীর ক্লিনিক্যাল ফ্যাক্টরসমূহ' : 'Observed Patient-Specific Clinical Modifiers'}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn ? 'ইলেক্ট্রনিক স্বাস্থ্য রেকর্ড ও বর্তমান ল্যাবরেটরি রিপোর্ট থেকে সংগৃহীত।' : 'Extracted from electronic health record history and current lab chemistry.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {risk.patient_specific_factors.map((f, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-start space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                <span className="text-foreground leading-relaxed font-medium">{translatePatientFactor(f)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Evidence Citations & Methodological Limitations */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>{isBn ? 'ক্লিনিক্যাল নির্দেশিকা, প্রমাণ ও সীমাবদ্ধতা' : 'Guidelines, Evidence Base & Limitations'}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn ? 'সিদ্ধান্তের মানদণ্ড সমর্থনকারী নির্ভরযোগ্য ক্লিনিক্যাল রেফারেন্স ও গবেষণাপত্র।' : 'Traceable clinical literature supporting decision thresholds.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-2">
              {risk.evidence_citations.map((cite, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900">
                  <span className="font-semibold text-teal-950 dark:text-teal-200 block">{cite.source} ({cite.year})</span>
                  <span className="text-[11px] text-muted-foreground">{cite.title}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border">
              <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1">
                {isBn ? 'মডেলের সীমাবদ্ধতা ও সতর্কতা:' : 'Model Constraints & Limitations:'}
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-muted-foreground">
                {risk.limitations.map((lim, idx) => (
                  <li key={idx} className="leading-relaxed">{translateLimitation(lim)}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
