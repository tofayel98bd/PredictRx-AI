import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  AlertTriangle,
  ShieldAlert,
  Users,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  HeartHandshake,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { getPrescriptionHistory } from '@/services/prescriptionService';
import { PrescriptionAnalysisResult } from '@/types';
import { DEMO_PATIENTS_LIST, MEDICAL_SAFETY_DISCLAIMER } from '@/constants';
import { formatDate } from '@/lib/utils';

export const DashboardPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrescriptionHistory()
      .then((data) => setPrescriptions(data))
      .catch((err) => console.error('Dashboard load error', err))
      .finally(() => setLoading(false));
  }, []);

  // Demo analytics aggregations
  const totalAnalyzed = 142;
  const criticalRiskCount = 18;
  const interactionsDetected = 37;
  const patientsReviewed = 89;

  const riskData = [
    { name: 'Low Risk', value: 74, color: '#10b981' },
    { name: 'Moderate Risk', value: 38, color: '#f59e0b' },
    { name: 'High Risk', value: 12, color: '#f97316' },
    { name: 'Critical Adverse', value: 18, color: '#ef4444' },
  ];

  const activityData = [
    { day: 'Mon', analyzed: 18, alerts: 3 },
    { day: 'Tue', analyzed: 24, alerts: 5 },
    { day: 'Wed', analyzed: 21, alerts: 4 },
    { day: 'Thu', analyzed: 32, alerts: 8 },
    { day: 'Fri', analyzed: 28, alerts: 6 },
    { day: 'Sat', analyzed: 12, alerts: 2 },
    { day: 'Sun', analyzed: 7, alerts: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Clinical Advisory Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-900 to-emerald-950 text-white shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
              Bangladesh CDSS Intelligence Hub
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            PredictRx Clinical Dashboard
          </h2>
          <p className="mt-1 text-xs text-teal-200/90 max-w-xl">
            Continuous pharmacovigilance, multimodal prescription OCR, and explainable safety analysis for Bangladesh healthcare institutions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-medium">
            <Link to="/analyze">
              <FileSearch className="mr-2 h-4 w-4" />
              Analyze Prescription
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="bg-teal-800/60 border-teal-700 text-teal-100 hover:bg-teal-700">
            <Link to="/drug-interactions">
              <ShieldAlert className="mr-2 h-4 w-4 text-amber-400" />
              Drug Interaction Center
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Prescriptions</span>
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                <FileSearch className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-foreground">{totalAnalyzed}</span>
              <span className="text-xs text-emerald-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" /> +14% this week
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Across Dhaka & regional clinics</p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Critical Adverse Risks</span>
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-red-600">{criticalRiskCount}</span>
              <Badge variant="critical" className="text-[10px]">
                Requires Review
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Contraindicated NSAIDs, overdose, duplications</p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Drug Interactions Flagged</span>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-amber-600">{interactionsDetected}</span>
              <span className="text-xs text-muted-foreground">26.1% of volume</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Pharmacodynamic & pharmacokinetic clashes</p>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Patients Monitored</span>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-foreground">{patientsReviewed}</span>
              <span className="text-xs text-blue-600">100% profile linked</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">With baseline eGFR / lab histories</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section: Risk Distribution & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <Card className="border-border lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Risk Distribution</CardTitle>
              <Badge variant="outline" className="text-[10px]">Cohort</Badge>
            </div>
            <CardDescription className="text-xs">
              Categorization of analyzed prescriptions by safety severity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {riskData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}:</span>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prescription Analysis Activity Chart */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Analysis Activity & Safety Alerts</CardTitle>
                <CardDescription className="text-xs">
                  Daily throughput of prescription OCR parses vs clinical alerts.
                </CardDescription>
              </div>
              <Badge variant="demo">Simulated 7-Day Trend</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="day" fontSize={11} />
                  <YAxis fontSize={11} />
                  <RechartsTooltip />
                  <Bar dataKey="analyzed" name="Analyzed" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="alerts" name="Safety Alerts" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex items-center justify-center space-x-6 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded bg-teal-700" />
                <span>Prescriptions Processed</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded bg-red-500" />
                <span>Critical / Warning Alerts</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Prescription Analyses & Live Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of Recent Prescriptions */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Recent Prescription Analyses</CardTitle>
              <CardDescription className="text-xs">
                Most recent OCR syntax and pharmacovigilance evaluations.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/prescriptions">View All Records</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-y border-border text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Prescription ID</th>
                    <th className="py-2.5 px-4 font-semibold">Patient</th>
                    <th className="py-2.5 px-4 font-semibold">Key Drugs</th>
                    <th className="py-2.5 px-4 font-semibold">Risk Level</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prescriptions.map((p) => {
                    const isCritical = p.clinical_risk.risk_classification === 'CRITICAL';
                    return (
                      <tr key={p.analysis_id} className="hover:bg-muted/30 transition">
                        <td className="py-3 px-4 font-mono font-medium text-foreground">
                          {p.prescription_id}
                          <span className="block text-[10px] text-muted-foreground font-sans">
                            {formatDate(p.timestamp)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-foreground">
                            {p.patient_context.name || 'Anonymous Patient'}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            Age: {p.patient_context.age} • eGFR: {p.patient_context.egfr ?? 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {p.extracted_prescription.map((m) => m.brand_name).join(', ')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={isCritical ? 'critical' : 'success'}>
                            {p.clinical_risk.risk_classification} ({p.clinical_risk.risk_score}/100)
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary">
                            <Link to={`/reports/${p.analysis_id}`}>
                              Details <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Live Safety Alerts & Quick Actions */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <CardTitle className="text-sm font-bold">Active Patient Safety Flags</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg border border-red-200 bg-red-50/70 dark:bg-red-950/30 text-xs">
                <div className="flex items-center justify-between font-semibold text-red-900 dark:text-red-300">
                  <span>NSAID + CKD Contraindication</span>
                  <Badge variant="critical" className="text-[9px]">CRITICAL</Badge>
                </div>
                <p className="mt-1 text-[11px] text-red-800/80 dark:text-red-400">
                  Ketorolac (Rolac 10) 14 days in Patient Md. Rafiqul Islam (eGFR 34.5). Immediate intervention recommended.
                </p>
                <div className="mt-2 flex justify-end">
                  <Button asChild size="sm" variant="critical" className="h-6 text-[10px] px-2">
                    <Link to="/risk-analysis/AN-2026-0941">Inspect Risk</Link>
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 dark:bg-amber-950/30 text-xs">
                <div className="flex items-center justify-between font-semibold text-amber-900 dark:text-amber-300">
                  <span>Therapeutic Duration Alert</span>
                  <Badge variant="warning" className="text-[9px]">WARNING</Badge>
                </div>
                <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-400">
                  Prescription course exceeds DGDA approved 5-day ceiling for acute injectable/oral ketorolac.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demonstration Mode Scenario Pill */}
          <Card className="border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-teal-900 dark:text-teal-200">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <span>Hackathon Demo Scenario Ready</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Test with 62yo CKD Stage 3 patient taking Bizoran 5/20 and Rolac 10 for 14 days. Click below to load pre-filled analysis.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full text-xs border-teal-300 text-teal-800 dark:text-teal-300">
                <Link to="/analyze?demo=true">
                  Load Hackathon Demo Scenario →
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Bangla Patient Companion Direct Card */}
          <Card className="border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  <HeartHandshake className="h-4 w-4 text-emerald-600" />
                  <span>সহজ বাংলা রোগী নির্দেশিকা</span>
                </div>
                <Badge variant="success" className="text-[10px]">অডিও সহ</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                রোগী এবং স্বজনদের জন্য সহজ ভাষায় প্রেসক্রিপশন নির্দেশিকা, খাওয়ার নিয়ম ও অডিও স্পিচ শুনুন।
              </p>
              <Button asChild size="sm" className="w-full text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-medium">
                <Link to="/bangla-companion">
                  বাংলা নির্দেশিকা খুলুন (Open Companion) →
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
