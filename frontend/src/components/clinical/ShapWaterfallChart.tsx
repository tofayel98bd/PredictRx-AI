import React from 'react';
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
  // Sort descending by magnitude of impact
  const sortedData = [...features].sort((a, b) => Math.abs(b.impact_score) - Math.abs(a.impact_score));

  const chartData = sortedData.map((f) => ({
    name: f.feature,
    score: Number((f.impact_score * 100).toFixed(1)),
    category: f.category,
    rawScore: f.impact_score,
    explanation: f.clinical_explanation,
    value: f.value,
  }));

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <CardTitle className="text-base font-bold">
                Explainable AI (XAI): SHAP Risk Factor Contributions
              </CardTitle>
              {isDemo && (
                <Badge variant="demo">
                  DEMO — NOT CLINICALLY VALIDATED
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-1">
              Shapley Additive Explanations decompose the overall adverse clinical risk into patient-specific factor weights.
            </CardDescription>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1">
              <span className="h-3 w-3 rounded bg-red-500" />
              <span className="text-muted-foreground">Increases Risk (+)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-3 w-3 rounded bg-emerald-600" />
              <span className="text-muted-foreground">Protective / Dampener (-)</span>
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
                width={180}
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
                        <p className="text-muted-foreground mt-0.5">Value: <span className="font-medium text-foreground">{String(data.value)}</span></p>
                        <div className="my-1.5 flex items-center space-x-1.5 font-semibold">
                          <span>Risk Shift:</span>
                          <span className={isPositive ? 'text-red-600' : 'text-emerald-600'}>
                            {isPositive ? `+${data.score}% adverse risk contribution` : `${data.score}% risk attenuation`}
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
            Clinician Factor Interpretability Breakdown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{f.feature}</span>
                    <Badge
                      variant={f.impact_score > 0 ? 'critical' : 'success'}
                      className="text-[10px] font-mono"
                    >
                      {f.impact_score > 0 ? `+${(f.impact_score * 100).toFixed(0)}% Risk` : `${(f.impact_score * 100).toFixed(0)}% Shield`}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    {f.clinical_explanation}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Category: {f.category}</span>
                  <span>Observed: <strong className="text-foreground">{String(f.value)}</strong></span>
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
                Understanding SHAP Values in Clinical Practice
              </p>
              <p className="text-[11px] text-teal-900/80 dark:text-teal-300/80 mt-0.5 leading-relaxed">
                SHAP values quantify each patient variable's contribution relative to baseline cohort incidence. Red bars represent risk escalators (such as off-label duration or acute renal impairment), whereas green bars represent stabilizing baseline buffers.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
