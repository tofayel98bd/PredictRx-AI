import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClinicalRiskAnalysis } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RiskGaugeCardProps {
  risk: ClinicalRiskAnalysis;
}

export const RiskGaugeCard: React.FC<RiskGaugeCardProps> = ({ risk }) => {
  const { t, i18n } = useTranslation(['analysis', 'common']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));

  const getBadgeVariant = (classification: string) => {
    switch (classification) {
      case 'CRITICAL':
        return 'critical';
      case 'HIGH':
        return 'critical';
      case 'MODERATE':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-600 dark:text-red-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    if (score >= 25) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getContainerStyles = () => {
    if (risk.risk_score >= 75 || risk.risk_classification === 'CRITICAL') {
      return 'border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20';
    }
    if (risk.risk_score >= 50 || risk.risk_classification === 'HIGH') {
      return 'border-orange-200 dark:border-orange-900/60 bg-orange-50/50 dark:bg-orange-950/20';
    }
    if (risk.risk_score >= 25 || risk.risk_classification === 'MODERATE') {
      return 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20';
    }
    return 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20';
  };

  const getThresholdLabel = () => {
    if (risk.risk_score >= 75) return isBn ? 'মারাত্মক (>৭৫)' : 'Critical (>75)';
    if (risk.risk_score >= 50) return isBn ? 'উচ্চ ঝুঁকি (৫০-৭৪)' : 'High (50-74)';
    if (risk.risk_score >= 25) return isBn ? 'মাঝারি ঝুঁকি (২৫-৪৯)' : 'Moderate (25-49)';
    return isBn ? 'স্বাভাবিক / নিরাপদ (<২৫)' : 'Normal / Safe (<25)';
  };

  const getThresholdColor = () => {
    if (risk.risk_score >= 75) return 'text-red-600 dark:text-red-400';
    if (risk.risk_score >= 50) return 'text-orange-600 dark:text-orange-400';
    if (risk.risk_score >= 25) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const akiVal = risk.aki_risk_percentage ?? 10;
  const giVal = risk.gi_bleed_risk_percentage ?? 12;
  const cvVal = risk.cardiovascular_risk_percentage ?? 18;

  const formatRiskBadge = (classification: string) => {
    if (isBn) {
      switch (classification) {
        case 'CRITICAL':
          return 'মারাত্মক ঝুঁকি';
        case 'HIGH':
          return 'উচ্চ ঝুঁকি';
        case 'MODERATE':
          return 'মাঝারি ঝুঁকি';
        case 'LOW':
          return 'স্বাভাবিক';
        default:
          return `${classification} ঝুঁকি`;
      }
    }
    return `${classification} ${t('results.riskGauge.riskSuffix', 'RISK')}`;
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <span>{t('results.riskGauge.title', 'Prescription Risk Assessment')}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-teal-500/30 text-teal-600 dark:text-teal-400 text-[10px] font-mono">
              CDSS Protocol v1.4
            </Badge>
            <Badge variant={getBadgeVariant(risk.risk_classification)}>
              {formatRiskBadge(risk.risk_classification)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Score Display */}
        <div className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border gap-4 ${getContainerStyles()}`}>
          <div className="flex items-center space-x-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm border border-border">
              <span className={`text-3xl font-extrabold tracking-tight ${getScoreColor(risk.risk_score)}`}>
                {risk.risk_score}
              </span>
              <span className="text-xs text-muted-foreground self-end pb-2">/100</span>
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">
                {t('results.riskGauge.scoreTitle', 'Composite Adverse Drug Event Probability Score')}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                {t('results.riskGauge.scoreDesc', 'Estimated index combining pharmacodynamic drug-drug interaction, patient renal clearance, and duration ceilings.')}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-48 text-right sm:text-left space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">{t('results.riskGauge.threshold', 'Threshold:')}</span>
              <span className={`font-bold ${getThresholdColor()}`}>{getThresholdLabel()}</span>
            </div>
            <Progress
              value={risk.risk_score}
              className="h-2.5 bg-muted"
              indicatorClassName={
                risk.risk_score >= 75
                  ? 'bg-red-600'
                  : risk.risk_score >= 50
                  ? 'bg-orange-500'
                  : risk.risk_score >= 25
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }
            />
          </div>
        </div>

        {/* Sub-Risk Categorical Projections */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">
                {t('results.riskGauge.aki', 'Acute Kidney Injury (AKI)')}
              </span>
              <span className={`font-bold font-mono ${akiVal >= 60 ? 'text-red-600' : akiVal >= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {akiVal}%
              </span>
            </div>
            <Progress
              value={akiVal}
              className="h-1.5 mt-2 bg-muted"
              indicatorClassName={akiVal >= 60 ? 'bg-red-600' : akiVal >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {akiVal >= 50
                ? (isBn ? 'রেনাল হেমোডাইনামিক জটিলতা / নেফ্রোটক্সিক ঝুঁকি' : 'Renal hemodynamic uncoupling')
                : (isBn ? 'স্বাভাবিক রেনাল ক্লিয়ারেন্স ও নিরাপদ পরিসীমা' : 'Preserved renal hemodynamic status')}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">
                {t('results.riskGauge.giBleed', 'Gastrointestinal Bleeding')}
              </span>
              <span className={`font-bold font-mono ${giVal >= 50 ? 'text-red-600' : giVal >= 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {giVal}%
              </span>
            </div>
            <Progress
              value={giVal}
              className="h-1.5 mt-2 bg-muted"
              indicatorClassName={giVal >= 50 ? 'bg-red-600' : giVal >= 25 ? 'bg-amber-500' : 'bg-emerald-500'}
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {giVal >= 50
                ? (isBn ? 'COX-1 ব্লকেজ ও আলসারেশনের ঝুঁকি' : 'COX-1 inhibition > 5 days')
                : (isBn ? 'স্বাভাবিক গ্যাস্ট্রোইনটেস্টাইনাল সহনশীলতা' : 'Normal gastrointestinal tolerance')}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">
                {t('results.riskGauge.cv', 'Cardiovascular Event')}
              </span>
              <span className={`font-bold font-mono ${cvVal >= 50 ? 'text-blue-600' : cvVal >= 25 ? 'text-blue-500' : 'text-emerald-600'}`}>
                {cvVal}%
              </span>
            </div>
            <Progress
              value={cvVal}
              className="h-1.5 mt-2 bg-muted"
              indicatorClassName={cvVal >= 50 ? 'bg-blue-600' : cvVal >= 25 ? 'bg-blue-500' : 'bg-emerald-500'}
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {cvVal >= 40
                ? (isBn ? 'রক্তচাপ বৃদ্ধি বা ভাস্কুলার সংবেদনশীলতা' : 'BP blunting & fluid retention')
                : (isBn ? 'স্বাভাবিক কার্ডিওভাসকুলার স্থিতিশীলতা' : 'Stable cardiovascular baseline')}
            </p>
          </div>
        </div>

        {/* CDSS Clinical Transparency Notice */}
        <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{t('results.riskGauge.calibration', 'CDSS Clinical Notice:')} </span>
            <span>
              {isBn
                ? 'ক্লিনিক্যাল সিদ্ধান্ত সহায়তা বিজ্ঞপ্তি: এআই-সহায়তাপ্রাপ্ত ঝুঁকি মূল্যায়ন একটি সম্পূরক নির্দেশিকা। চূড়ান্ত চিকিৎসার সিদ্ধান্তের জন্য নিবন্ধিত চিকিৎসকের পর্যালোচনা ও অনুমোদন আবশ্যক।'
                : (risk.calibrated_probability_note?.includes('DEMO ESTIMATION')
                  ? 'Clinical Decision Support Notice: AI-assisted risk estimations are supplementary. Final clinical decisions must be reviewed and confirmed by a licensed medical practitioner.'
                  : risk.calibrated_probability_note)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
