import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Activity,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  FileText,
  ArrowLeft,
  ArrowUpRight,
  Stethoscope,
  Heart,
  Droplet,
  Phone,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPatientById, getPatientPrescriptions } from '@/services/patientService';
import { Patient, PrescriptionAnalysisResult } from '@/types';
import { formatDate } from '@/lib/utils';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation(['patients', 'common']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([getPatientById(id), getPatientPrescriptions(id)])
        .then(([p, rx]) => {
          if (p) setPatient(p);
          setPrescriptions(rx);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (!patient && !loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">
          {t('empty.noData', { ns: 'common', defaultValue: 'Patient record not found.' })}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/patients">{t('detail.back', 'Back to Patient Directory')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link to="/patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{patient?.name}</h2>
              <Badge variant="outline" className="font-mono text-xs">{patient?.id}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isBn
                ? 'রোগীর বিস্তারিত ক্লিনিক্যাল প্রোফাইল, ল্যাব হিস্ট্রি এবং সিডিএসএস প্রেসক্রিপশন নিরাপত্তা ইতিহাস।'
                : 'Comprehensive clinical profile, longitudinal lab trajectory, and CDSS prescription safety history.'}
            </p>
          </div>
        </div>

        <Button asChild size="sm">
          <Link to={`/analyze?demo=true`}>
            <FileText className="mr-1.5 h-4 w-4" />
            {isBn ? 'নতুন প্রেসক্রিপশন বিশ্লেষণ' : 'Analyze New Prescription'}
          </Link>
        </Button>
      </div>

      {/* Patient Vitals and Lab Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground block">
              {t('detail.age', 'Age')} & {t('detail.gender', 'Gender')}
            </span>
            <span className="text-xl font-bold text-foreground mt-1 block">
              {patient?.age} {isBn ? 'বছর' : 'Years'} • {isBn ? (patient?.gender === 'Male' ? 'পুরুষ' : (patient?.gender === 'Female' ? 'মহিলা' : patient?.gender)) : patient?.gender}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {isBn ? 'রক্তের গ্রুপ: ' : 'Blood: '} {patient?.blood_group || 'O+'}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground block">
              {t('detail.creatinine', 'Serum Creatinine')}
            </span>
            <span className={`text-xl font-bold mt-1 block ${patient && patient.creatinine > 1.4 ? 'text-red-600' : 'text-foreground'}`}>
              {patient?.creatinine} mg/dL
            </span>
            <span className="text-[11px] text-muted-foreground">
              {isBn ? 'স্বাভাবিক মাত্রা: ০.৭ - ১.২' : 'Standard range: 0.7 - 1.2'}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground block">
              {t('detail.egfr', 'Renal eGFR')}
            </span>
            <span className={`text-xl font-bold mt-1 block ${patient && patient.egfr < 60 ? 'text-red-600' : 'text-foreground'}`}>
              {patient?.egfr} mL/min
            </span>
            <span className="text-[11px] text-red-600 font-medium">
              {isBn ? 'স্টেজ 3b ক্রনিক কিডনি ডিজিজ' : 'Stage 3b Chronic Kidney Disease'}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground block">
              {t('detail.hba1c', 'Glycated HbA1c')}
            </span>
            <span className={`text-xl font-bold mt-1 block ${patient && patient.hba1c > 8.0 ? 'text-amber-600' : 'text-foreground'}`}>
              {patient?.hba1c}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {isBn ? 'উচ্চ ডায়াবেটিক গ্লাইসেমিক ইনডেক্স' : 'Elevated diabetic glycemic index'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Conditions & Prescriptions History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Diagnoses & Allergies */}
        <Card className="border-border lg:col-span-1 space-y-4">
          <CardHeader>
            <CardTitle className="text-sm font-bold">
              {t('detail.conditions', 'Diagnosed Conditions & Warnings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground block mb-2">
                {isBn ? 'সহবর্তী রোগসমূহ:' : 'Comorbid Diagnoses:'}
              </span>
              <div className="space-y-1.5">
                {patient?.conditions.map((c, i) => (
                  <div key={i} className="p-2 rounded-md bg-muted/40 border border-border flex items-center space-x-2">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-foreground">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-semibold text-muted-foreground block mb-1">
                {t('detail.allergies', 'Drug Allergies')}:
              </span>
              <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-900 dark:text-red-300">
                {patient?.allergies.join(', ') || (isBn ? 'কোনো অ্যালার্জির রেকর্ড নেই' : 'No recorded allergies')}
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="font-semibold text-muted-foreground block mb-1">
                {t('detail.phone', 'Contact Reference')}:
              </span>
              <p className="text-muted-foreground">{patient?.phone || '+880 1712-345678'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Prescriptions History */}
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">
                {t('detail.recentPrescriptions', 'Prescription & Safety Evaluation History')}
              </CardTitle>
              <Badge variant="outline">
                {prescriptions.length} {isBn ? 'টি রেকর্ড' : 'Records'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {isBn
                ? 'এই রোগীর প্রোফাইলের সাথে যুক্ত প্রতিটি বিশ্লেষিত প্রেসক্রিপশন।'
                : 'Every analyzed prescription associated with this patient profile.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prescriptions.map((rx) => {
              const isCritical = rx.clinical_risk.risk_classification === 'CRITICAL';
              const riskBadgeText = isBn
                ? (rx.clinical_risk.risk_classification === 'CRITICAL' ? 'মারাত্মক ঝুঁকি' : 'স্বাভাবিক')
                : rx.clinical_risk.risk_classification;
              return (
                <div
                  key={rx.analysis_id}
                  className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-foreground">{rx.prescription_id}</span>
                      <span className="text-[11px] text-muted-foreground">({formatDate(rx.timestamp)})</span>
                      {rx.clinical_risk.is_synthetic_demo && <Badge variant="demo" className="text-[9px]">{isBn ? 'ডেমো' : 'DEMO'}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>{isBn ? 'ওষুধসমূহ: ' : 'Medications: '}</strong>{rx.extracted_prescription.map((m) => m.brand_name).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={isCritical ? 'critical' : 'success'}>
                      {riskBadgeText} ({rx.clinical_risk.risk_score}/100)
                    </Badge>
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                      <Link to={`/reports/${rx.analysis_id}`}>
                        {isBn ? 'রিপোর্ট' : 'Report'} <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
