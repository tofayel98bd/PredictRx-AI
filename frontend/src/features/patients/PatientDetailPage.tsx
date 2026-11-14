import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
        <p className="text-sm font-semibold text-muted-foreground">Patient record not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/patients">Back to Patient Directory</Link>
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
              Comprehensive clinical profile, longitudinal lab trajectory, and CDSS prescription safety history.
            </p>
          </div>
        </div>

        <Button asChild size="sm">
          <Link to={`/analyze?demo=true`}>
            <FileText className="mr-1.5 h-4 w-4" />
            Analyze New Prescription
          </Link>
        </Button>
      </div>

      {/* Patient Vitals and Lab Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground block">Age & Gender</span>
            <span className="text-xl font-bold text-foreground mt-1 block">
              {patient?.age} Years • {patient?.gender}
            </span>
            <span className="text-[11px] text-muted-foreground">Blood: {patient?.blood_group || 'O+'}</span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground block">Serum Creatinine</span>
            <span className={`text-xl font-bold mt-1 block ${patient && patient.creatinine > 1.4 ? 'text-red-600' : 'text-foreground'}`}>
              {patient?.creatinine} mg/dL
            </span>
            <span className="text-[11px] text-muted-foreground">Standard range: 0.7 - 1.2</span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground block">Renal eGFR</span>
            <span className={`text-xl font-bold mt-1 block ${patient && patient.egfr < 60 ? 'text-red-600' : 'text-foreground'}`}>
              {patient?.egfr} mL/min
            </span>
            <span className="text-[11px] text-red-600 font-medium">Stage 3b Chronic Kidney Disease</span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground block">Glycated HbA1c</span>
            <span className={`text-xl font-bold mt-1 block ${patient && patient.hba1c > 8.0 ? 'text-amber-600' : 'text-foreground'}`}>
              {patient?.hba1c}%
            </span>
            <span className="text-[11px] text-muted-foreground">Elevated diabetic glycemic index</span>
          </CardContent>
        </Card>
      </div>

      {/* Conditions & Prescriptions History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Diagnoses & Allergies */}
        <Card className="border-border lg:col-span-1 space-y-4">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Diagnosed Conditions & Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground block mb-2">Comorbid Diagnoses:</span>
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
              <span className="font-semibold text-muted-foreground block mb-1">Drug Allergies:</span>
              <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-900 dark:text-red-300">
                {patient?.allergies.join(', ') || 'No recorded allergies'}
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="font-semibold text-muted-foreground block mb-1">Contact Reference:</span>
              <p className="text-muted-foreground">{patient?.phone || '+880 1712-345678'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Prescriptions History */}
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Prescription & Safety Evaluation History</CardTitle>
              <Badge variant="outline">{prescriptions.length} Records</Badge>
            </div>
            <CardDescription className="text-xs">
              Every analyzed prescription associated with this patient profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prescriptions.map((rx) => {
              const isCritical = rx.clinical_risk.risk_classification === 'CRITICAL';
              return (
                <div
                  key={rx.analysis_id}
                  className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-foreground">{rx.prescription_id}</span>
                      <span className="text-[11px] text-muted-foreground">({formatDate(rx.timestamp)})</span>
                      {rx.clinical_risk.is_synthetic_demo && <Badge variant="demo" className="text-[9px]">DEMO</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Medications: </strong>{rx.extracted_prescription.map((m) => m.brand_name).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={isCritical ? 'critical' : 'success'}>
                      {rx.clinical_risk.risk_classification} ({rx.clinical_risk.risk_score}/100)
                    </Badge>
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                      <Link to={`/reports/${rx.analysis_id}`}>
                        Report <ArrowUpRight className="ml-1 h-3 w-3" />
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
