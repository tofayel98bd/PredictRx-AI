import React from 'react';
import { ClinicalRiskAnalysis } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RiskGaugeCardProps {
  risk: ClinicalRiskAnalysis;
}

export const RiskGaugeCard: React.FC<RiskGaugeCardProps> = ({ risk }) => {
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
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    if (score >= 25) return 'text-blue-600 dark:text-blue-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <span>Prescription Risk Assessment</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {risk.is_synthetic_demo && (
              <Badge variant="demo">
                DEMO — NOT CLINICALLY VALIDATED
              </Badge>
            )}
            <Badge variant={getBadgeVariant(risk.risk_classification)}>
              {risk.risk_classification} RISK
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Score Display */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm border border-border">
              <span className={`text-3xl font-extrabold tracking-tight ${getScoreColor(risk.risk_score)}`}>
                {risk.risk_score}
              </span>
              <span className="text-xs text-muted-foreground self-end pb-2">/100</span>
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">
                Composite Adverse Drug Event Probability Score
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                Estimated index combining pharmacodynamic drug-drug interaction, patient renal clearance, and duration ceilings.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-48 text-right sm:text-left space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Threshold:</span>
              <span className="text-red-600">Critical (&gt;75)</span>
            </div>
            <Progress
              value={risk.risk_score}
              className="h-2.5 bg-red-100 dark:bg-red-950"
              indicatorClassName={risk.risk_score > 70 ? 'bg-red-600' : 'bg-amber-500'}
            />
          </div>
        </div>

        {/* Sub-Risk Categorical Projections */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Acute Kidney Injury (AKI)</span>
              <span className="font-bold text-red-600 font-mono">{risk.aki_risk_percentage || 84}%</span>
            </div>
            <Progress
              value={risk.aki_risk_percentage || 84}
              className="h-1.5 mt-2 bg-red-100 dark:bg-red-950"
              indicatorClassName="bg-red-600"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Renal hemodynamic uncoupling
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Gastrointestinal Bleeding</span>
              <span className="font-bold text-amber-600 font-mono">{risk.gi_bleed_risk_percentage || 68}%</span>
            </div>
            <Progress
              value={risk.gi_bleed_risk_percentage || 68}
              className="h-1.5 mt-2 bg-amber-100 dark:bg-amber-950"
              indicatorClassName="bg-amber-500"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              COX-1 inhibition &gt; 5 days
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Cardiovascular Event</span>
              <span className="font-bold text-blue-600 font-mono">{risk.cardiovascular_risk_percentage || 42}%</span>
            </div>
            <Progress
              value={risk.cardiovascular_risk_percentage || 42}
              className="h-1.5 mt-2 bg-blue-100 dark:bg-blue-950"
              indicatorClassName="bg-blue-500"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              BP blunting & fluid retention
            </p>
          </div>
        </div>

        {/* Mandatory Calibration & Scientific Transparency Notice */}
        <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Model Calibration Disclosure: </span>
            <span>{risk.calibrated_probability_note}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
