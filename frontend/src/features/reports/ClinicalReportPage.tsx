import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Share2,
  HeartHandshake,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClinicianReviewModal } from '@/components/clinical/ClinicianReviewModal';
import { BanglaPatientCompanion } from '@/components/clinical/BanglaPatientCompanion';
import { getPrescriptionById } from '@/services/prescriptionService';
import { exportAnalysisJson, triggerPrintReport } from '@/services/reportService';
import { PrescriptionAnalysisResult } from '@/types';
import { DEMO_ANALYSIS_RESULT, MEDICAL_SAFETY_DISCLAIMER } from '@/constants';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export const ClinicalReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<PrescriptionAnalysisResult | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    getPrescriptionById(id || 'AN-2026-0941')
      .then((data) => setReport(data || DEMO_ANALYSIS_RESULT))
      .catch(() => setReport(DEMO_ANALYSIS_RESULT));
  }, [id]);

  if (!report) return null;

  const isCritical = report.clinical_risk.risk_classification === 'CRITICAL';

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link to="/prescriptions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Official CDSS Clinical Audit Report
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prescription Ref: <span className="font-mono">{report.prescription_id}</span> • Analysis:{' '}
              <span className="font-mono">{report.analysis_id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
          >
            <Link to={`/bangla-companion/${report.analysis_id}`}>
              <HeartHandshake className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              বাংলা নির্দেশিকা
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrintReport}
            className="text-xs"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print Report
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportAnalysisJson(report);
              toast.success('Clinical report exported as JSON for EHR archive.');
            }}
            className="text-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export EHR JSON
          </Button>

          <Button
            size="sm"
            onClick={() => setIsReviewModalOpen(true)}
            className="text-xs bg-primary text-primary-foreground font-semibold"
          >
            <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
            Clinician Sign-Off
          </Button>
        </div>
      </div>

      {/* Official Clinical Report Paper Container */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm card-print space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-2xl tracking-tight text-primary">PredictRx-AI</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                CDSS v1.4
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clinical Decision Support & Pharmacovigilance Audit Trail
            </p>
            <p className="text-[11px] text-muted-foreground">
              Dhaka Medical College Hospital / National CDSS Pilot Network
            </p>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1">
            <p className="font-semibold text-foreground">Report ID: {report.analysis_id}</p>
            <p className="text-muted-foreground">Prescription Ref: {report.prescription_id}</p>
            <p className="text-muted-foreground">Generated: {formatDate(report.timestamp)}</p>
            <Badge variant={isCritical ? 'critical' : 'success'} className="mt-1">
              {report.clinical_risk.risk_classification} RISK RATING
            </Badge>
          </div>
        </div>

        {/* Patient Reference Box */}
        <div className="p-4 rounded-xl border border-border bg-muted/20">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Patient Demographics & Organ Function Profile
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">Patient Name / ID</span>
              <span className="font-bold text-foreground">
                {report.patient_context.name || 'Anonymous Patient'}
              </span>
              <span className="block text-[10px] text-muted-foreground font-mono">
                {report.patient_context.patient_id || 'PRX-BD-2026-081'}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px]">Age & Gender</span>
              <span className="font-semibold text-foreground">
                {report.patient_context.age} Years • {report.patient_context.gender}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Weight: {report.patient_context.weight_kg ?? 68} kg
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px]">Renal Labs (eGFR / Cr)</span>
              <span className="font-bold text-red-600">
                eGFR: {report.patient_context.egfr ?? '34.5'} mL/min
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Creatinine: {report.patient_context.creatinine ?? '2.1'} mg/dL
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px]">Diabetic & BP Status</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                HbA1c: {report.patient_context.hba1c ?? '8.4'}%
              </span>
              <span className="block text-[10px] text-muted-foreground">
                BP: {report.patient_context.systolic_bp || 148}/{report.patient_context.diastolic_bp || 92} mmHg
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <strong className="text-muted-foreground">Diagnoses: </strong>
              <span>{report.patient_context.conditions.join(', ')}</span>
            </div>
            <div>
              <strong className="text-muted-foreground">Allergies: </strong>
              <span className="text-red-600">{report.patient_context.allergies?.join(', ') || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Extracted Medications Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Extracted Medications & Syntax Compliance
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2 px-3 font-semibold">Brand Prescribed</th>
                  <th className="py-2 px-3 font-semibold">Generic Normalized</th>
                  <th className="py-2 px-3 font-semibold">Dosage Pattern</th>
                  <th className="py-2 px-3 font-semibold">Duration</th>
                  <th className="py-2 px-3 font-semibold">Safety Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.extracted_prescription.map((m, i) => (
                  <tr key={i}>
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      {m.brand_name} ({m.strength || 'Standard'})
                    </td>
                    <td className="py-2.5 px-3 font-medium text-teal-800 dark:text-teal-300">
                      {m.generic_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{m.dosage_syntax} ({m.timing})</td>
                    <td className="py-2.5 px-3">{m.duration_days} days</td>
                    <td className="py-2.5 px-3">
                      {m.issues.length === 0 ? (
                        <span className="text-emerald-600 font-medium">None</span>
                      ) : (
                        m.issues.map((issue, idx) => (
                          <span
                            key={idx}
                            className={`inline-block mr-1 text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {issue.code}
                          </span>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prescription Alerts & Drug Interactions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Clinical Safety Alerts & Contraindications
          </h4>
          <div className="space-y-2">
            {report.prescription_level_alerts.map((alert, i) => (
              <div key={i} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 text-xs">
                <span className="font-bold text-red-900 dark:text-red-300 block">{alert.code}:</span>
                <p className="text-red-800 dark:text-red-400 mt-0.5">{alert.message}</p>
              </div>
            ))}

            {report.drug_interactions.map((interaction, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    Interaction: {interaction.drug_a} ↔ {interaction.drug_b}
                  </span>
                  <Badge variant={interaction.severity === 'CRITICAL' ? 'critical' : 'warning'}>
                    {interaction.severity}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{interaction.mechanism}</p>
                <p className="text-red-700 dark:text-red-400 font-medium">
                  Recommendation: {interaction.recommended_action}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Clinician Review & Decision Audit Sign-Off Box */}
        <div className="p-5 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h4 className="font-bold text-sm text-foreground">Attending Clinician Determination</h4>
            </div>
            {report.clinician_review.reviewed ? (
              <Badge variant="success">REVIEWED & SIGNED</Badge>
            ) : (
              <Badge variant="warning">PENDING CLINICIAN REVIEW</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div>
              <span className="text-muted-foreground block text-[10px]">Reviewing Physician:</span>
              <span className="font-bold text-foreground">
                {report.clinician_review.reviewer_name || 'Dr. M. Ashraful Hoque'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">BMDC Registration:</span>
              <span className="font-bold text-foreground font-mono">
                {report.clinician_review.reviewer_license || 'BMDC #A-89412'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Decision:</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {report.clinician_review.decision || 'MODIFIED (Discontinued Ketorolac)'}
              </span>
            </div>
          </div>

          <div className="text-xs pt-2 border-t border-border/60">
            <span className="text-muted-foreground font-semibold">Clinician Notes: </span>
            <span className="text-foreground">
              {report.clinician_review.notes ||
                'Ketorolac cancelled due to CKD 3b. Replaced with Paracetamol (Napa Extend) 665mg PRN. Maintained Bizoran 5/20 with repeat creatinine in 2 weeks.'}
            </span>
          </div>
        </div>

        {/* Bangla Patient Companion Embedded Section */}
        <div className="pt-2">
          <BanglaPatientCompanion
            data={report.bangla_companion}
            patientName={report.patient_context.name}
          />
        </div>

        {/* Mandatory Safety Notice */}
        <div className="p-3 rounded-lg border border-border bg-muted/40 text-[11px] text-muted-foreground leading-relaxed">
          <strong>Legal & Medical Safety Disclaimer: </strong>
          {MEDICAL_SAFETY_DISCLAIMER}
        </div>
      </div>

      {/* Review Modal */}
      <ClinicianReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        analysisId={report.analysis_id}
        currentDecision={report.clinician_review.decision}
        onReviewSaved={() => {
          setReport({
            ...report,
            clinician_review: {
              ...report.clinician_review,
              reviewed: true,
            },
          });
        }}
      />
    </div>
  );
};
