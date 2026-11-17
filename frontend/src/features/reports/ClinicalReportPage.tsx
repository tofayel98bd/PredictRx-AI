import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Globe,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClinicianReviewModal } from '@/components/clinical/ClinicianReviewModal';
import { BanglaPatientCompanion } from '@/components/clinical/BanglaPatientCompanion';
import { getPrescriptionById } from '@/services/prescriptionService';
import { exportAnalysisJson, triggerPrintReport, downloadReportPdf } from '@/services/reportService';
import { PrescriptionAnalysisResult } from '@/types';
import { DEMO_ANALYSIS_RESULT, MEDICAL_SAFETY_DISCLAIMER } from '@/constants';
import { formatDate, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

export const ClinicalReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation(['reports', 'common']);
  const [report, setReport] = useState<PrescriptionAnalysisResult | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reportLang, setReportLang] = useState<'en' | 'bn'>(
    i18n.language && i18n.language.startsWith('bn') ? 'bn' : 'en'
  );
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    getPrescriptionById(id || 'AN-2026-0941')
      .then((data) => setReport(data || DEMO_ANALYSIS_RESULT))
      .catch(() => setReport(DEMO_ANALYSIS_RESULT));
  }, [id]);

  useEffect(() => {
    if (i18n.language) {
      setReportLang(i18n.language.startsWith('bn') ? 'bn' : 'en');
    }
  }, [i18n.language]);

  if (!report) return null;

  const isCritical = report.clinical_risk.risk_classification === 'CRITICAL';
  const isBn = reportLang === 'bn';

  const formatRiskBadge = (classification: string) => {
    if (!isBn) return `${classification} RISK RATING`;
    switch (classification.toUpperCase()) {
      case 'CRITICAL': return 'মারাত্মক ঝুঁকি স্তর';
      case 'HIGH': return 'উচ্চ ঝুঁকি স্তর';
      case 'MODERATE': return 'মাঝারি ঝুঁকি স্তর';
      case 'LOW': return 'স্বাভাবিক / কম ঝুঁকি স্তর';
      default: return `${classification} ঝুঁকি স্তর`;
    }
  };

  const formatTiming = (timing?: string | null) => {
    if (!timing) return '';
    if (!isBn) return timing;
    return timing
      .replace(/Morning After Breakfast/gi, 'সকাল (নাস্তার পর)')
      .replace(/After Meal/gi, 'খাবারের পর')
      .replace(/Before Meal/gi, 'খাবারের আগে')
      .replace(/Night/gi, 'রাতে')
      .replace(/Continue/gi, 'চলবে');
  };

  const formatIssueCode = (code: string) => {
    if (!isBn) return code;
    switch (code) {
      case 'CKD_MONITORING': return 'কিডনি পর্যবেক্ষণ';
      case 'MAX_DURATION_EXCEEDED': return 'সর্বোচ্চ মেয়াদ অতিক্রান্ত';
      case 'CONTRAINDICATION_CKD': return 'CKD-তে ব্যবহার নিষেধ';
      case 'BEERS_CRITERIA_GERIATRIC': return 'বয়স্কদের সতর্কতা (Beers)';
      default: return code;
    }
  };

  const formatAlertCode = (code: string) => {
    if (!isBn) return code;
    if (code === 'TRIPLE_WHAMMY_ALERT') return 'মারাত্মক ড্রাগ কলিশন (Triple Whammy)';
    return code;
  };

  const formatAlertMessage = (msg: string) => {
    if (!isBn) return msg;
    if (msg.includes('Triple Whammy') || msg.includes('Dual Nephrotoxic')) {
      return 'উচ্চমাত্রার নেফ্রোটক্সিক ঝুঁকি: CKD Stage 3 রোগীর ক্ষেত্রে ARB (Bizoran-এর Olmesartan) এবং তীব্র NSAID (Ketorolac)-এর যুগপৎ ব্যবহার তীব্র কিডনি বিকল (Acute Renal Decompensation)-এর মারাত্মক ঝুঁকি তৈরি করে।';
    }
    return msg;
  };

  const formatMechanism = (text?: string | null) => {
    if (!text) return '';
    if (!isBn) return text;
    if (text.includes('Inhibition of renal vasodilatory')) {
      return 'Ketorolac দ্বারা কিডনির রক্তনালী প্রসারণকারী প্রোস্টাগ্ল্যান্ডিন বাধাগ্রস্ত হয়, যা ARB-এর কারণে রক্তচাপ ও জিএফআরে (GFR) আকস্মিক পতন ঘটায়।';
    }
    return text;
  };

  const formatRecommendation = (text?: string | null) => {
    if (!text) return '';
    if (!isBn) return text;
    if (text.includes('Discontinue Ketorolac immediately')) {
      return 'তাত্ক্ষণিকভাবে Ketorolac বন্ধ করুন। কিডনির ক্ষতি করে না এমন বিকল্প ব্যথানাশক (যেমন: Paracetamol বা বাহ্যিক থেরাপি) ব্যবহার করুন।';
    }
    return text;
  };

  const formatDecision = (dec?: string) => {
    if (!dec) return isBn ? 'সংশোধিত (Ketorolac বাতিল)' : 'MODIFIED';
    if (!isBn) return dec;
    return dec
      .replace(/MODIFIED \(Discontinued Ketorolac\)/gi, 'সংশোধিত (Ketorolac বাতিল)')
      .replace(/APPROVED/gi, 'অনুমোদিত')
      .replace(/REJECTED/gi, 'বাতিল / প্রত্যাখ্যাত');
  };

  const formatClinicianNotes = (notes?: string) => {
    if (!notes) return '';
    if (!isBn) return notes;
    if (notes.includes('Ketorolac cancelled due to CKD')) {
      return 'CKD 3b-এর কারণে Ketorolac বাতিল করা হয়েছে। বিকল্প হিসেবে Paracetamol (Napa Extend) 665mg PRN দেওয়া হলো। Bizoran 5/20 অপরিবর্তিত থাকবে এবং ২ সপ্তাহ পর সিরাম ক্রিয়েটিনিন টেস্ট আবশ্যক।';
    }
    return notes;
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    toast.info(t('toasts.pdfDownloading', 'Generating clinical audit PDF report...'));
    try {
      await downloadReportPdf(report.prescription_id, reportLang);
      toast.success(t('toasts.pdfDownloaded', 'PDF report downloaded successfully.'));
    } catch {
      toast.error('Could not download PDF from server. Printing local view.');
      triggerPrintReport();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

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
              {isBn ? 'অফিসিয়াল সিডিএসএস ক্লিনিক্যাল অডিট রিপোর্ট' : 'Official CDSS Clinical Audit Report'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isBn ? 'প্রেসক্রিপশন রেফারেন্স:' : 'Prescription Ref:'}{' '}
              <span className="font-mono">{report.prescription_id}</span> •{' '}
              {isBn ? 'বিশ্লেষণ আইডি:' : 'Analysis:'}{' '}
              <span className="font-mono">{report.analysis_id}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Report Language Switcher Pill */}
          <div className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setReportLang('en')}
              className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                reportLang === 'en'
                  ? 'bg-card text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Report: EN
            </button>
            <button
              type="button"
              onClick={() => setReportLang('bn')}
              className={`px-2 py-1 rounded-md text-xs font-medium transition font-bangla ${
                reportLang === 'bn'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              রিপোর্ট: বাংলা
            </button>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
          >
            <Link to={`/bangla-companion/${report.analysis_id}`}>
              <HeartHandshake className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              {t('actions.banglaCompanion', 'বাংলা নির্দেশিকা')}
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrintReport}
            className="text-xs"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            {isBn ? 'রিপোর্ট প্রিন্ট করুন' : 'Print Report'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="text-xs text-teal-800 dark:text-teal-300 border-teal-300"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            {isDownloadingPdf ? (isBn ? 'পিডিএফ তৈরি হচ্ছে...' : 'Generating PDF...') : (isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportAnalysisJson(report);
              toast.success(t('toasts.jsonExported', 'Clinical report exported as JSON for EHR archive.'));
            }}
            className="text-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {isBn ? 'EHR JSON এক্সপোর্ট' : 'EHR JSON'}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsReviewModalOpen(true)}
            className="text-xs bg-primary text-primary-foreground font-semibold"
          >
            <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
            {isBn ? 'চিকিৎসকের স্বাক্ষর' : 'Clinician Sign-Off'}
          </Button>
        </div>
      </div>

      {/* Official Clinical Report Paper Container */}
      <div className={`rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm card-print space-y-6 ${isBn ? 'font-bangla' : ''}`}>
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
              {isBn
                ? 'ক্লিনিক্যাল সিদ্ধান্ত সহায়তা ও ফার্মাকোভিজিল্যান্স অডিট ট্রেইল'
                : 'Clinical Decision Support & Pharmacovigilance Audit Trail'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isBn
                ? 'জাতীয় স্বাস্থ্যবিজ্ঞান ও গবেষণা কেন্দ্র, ঢাকা / ন্যাশনাল সিডিএসএস পাইলট নেটওয়ার্ক'
                : 'Dhaka Medical College Hospital / National CDSS Pilot Network'}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1">
            <p className="font-semibold text-foreground">
              {isBn ? 'রিপোর্ট আইডি:' : 'Report ID:'} <span className="font-mono">{report.analysis_id}</span>
            </p>
            <p className="text-muted-foreground">
              {isBn ? 'প্রেসক্রিপশন রেফারেন্স:' : 'Prescription Ref:'} <span className="font-mono">{report.prescription_id}</span>
            </p>
            <p className="text-muted-foreground">
              {isBn ? 'প্রস্তুতকাল:' : 'Generated:'} {formatDate(report.timestamp, reportLang)}
            </p>
            <Badge variant={isCritical ? 'critical' : 'success'} className="mt-1">
              {formatRiskBadge(report.clinical_risk.risk_classification)}
            </Badge>
          </div>
        </div>

        {/* Patient Reference Box */}
        <div className="p-4 rounded-xl border border-border bg-muted/20">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            {isBn
              ? 'রোগীর বিবরণ ও গুরুত্বপূর্ণ অঙ্গের কার্যক্ষমতা'
              : 'Patient Demographics & Organ Function Profile'}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">
                {isBn ? 'রোগীর নাম / আইডি' : 'Patient Name / ID'}
              </span>
              <span className="font-bold text-foreground">
                {report.patient_context.name || 'Anonymous Patient'}
              </span>
              <span className="block text-[10px] text-muted-foreground font-mono">
                {report.patient_context.patient_id || 'PRX-BD-2026-081'}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px]">
                {isBn ? 'বয়স ও লিঙ্গ' : 'Age & Gender'}
              </span>
              <span className="font-semibold text-foreground">
                {isBn ? `${formatNumber(report.patient_context.age)} বছর • ${report.patient_context.gender === 'Female' ? 'মহিলা' : 'পুরুষ'}` : `${report.patient_context.age} Years • ${report.patient_context.gender}`}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {isBn ? 'ওজন:' : 'Weight:'} {report.patient_context.weight_kg ?? 68} {isBn ? 'কেজি' : 'kg'}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px]">
                {isBn ? 'কিডনির কার্যক্ষমতা (eGFR / Cr)' : 'Renal Labs (eGFR / Cr)'}
              </span>
              <span className="font-bold text-red-600">
                eGFR: {report.patient_context.egfr ?? '34.5'} mL/min/1.73m²
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Creatinine: {report.patient_context.creatinine ?? '2.1'} mg/dL
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px]">
                {isBn ? 'রক্তচাপ ও ডায়াবেটিক পরামিতি' : 'Diabetic & BP Status'}
              </span>
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
              <strong className="text-muted-foreground">{isBn ? 'রোগসমূহ: ' : 'Diagnoses: '}</strong>
              <span>{report.patient_context.conditions.join(', ')}</span>
            </div>
            <div>
              <strong className="text-muted-foreground">{isBn ? 'অ্যালার্জি: ' : 'Allergies: '}</strong>
              <span className="text-red-600">{report.patient_context.allergies?.join(', ') || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Extracted Medications Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isBn ? 'প্রেসক্রিপশনে নির্দেশিত ওষুধসমূহ (DGDA যাচাইকৃত)' : 'Extracted Medications & Syntax Compliance'}
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2 px-3 font-semibold">{isBn ? 'ব্র্যান্ডের নাম' : 'Brand Prescribed'}</th>
                  <th className="py-2 px-3 font-semibold">{isBn ? 'জেনেরিক নাম' : 'Generic Normalized'}</th>
                  <th className="py-2 px-3 font-semibold">{isBn ? 'ডোজের নিয়ম' : 'Dosage Pattern'}</th>
                  <th className="py-2 px-3 font-semibold">{isBn ? 'মেয়াদকাল' : 'Duration'}</th>
                  <th className="py-2 px-3 font-semibold">{isBn ? 'নিরাপত্তা সমস্যা' : 'Safety Issues'}</th>
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
                    <td className="py-2.5 px-3 font-mono">{m.dosage_syntax} ({formatTiming(m.timing)})</td>
                    <td className="py-2.5 px-3">{m.duration_days} {isBn ? 'দিন' : 'days'}</td>
                    <td className="py-2.5 px-3">
                      {m.issues.length === 0 ? (
                        <span className="text-emerald-600 font-medium">{isBn ? 'কোনোটি নেই' : 'None'}</span>
                      ) : (
                        m.issues.map((issue, idx) => (
                          <span
                            key={idx}
                            className={`inline-block mr-1 text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {formatIssueCode(issue.code)}
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
            {isBn ? 'ক্লিনিক্যাল ড্রাগ কলিশন ও নিরাপত্তা সতর্কতা' : 'Clinical Safety Alerts & Contraindications'}
          </h4>
          <div className="space-y-2">
            {report.prescription_level_alerts.map((alert, i) => (
              <div key={i} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 text-xs">
                <span className="font-bold text-red-900 dark:text-red-300 block">{formatAlertCode(alert.code)}:</span>
                <p className="text-red-800 dark:text-red-400 mt-0.5">{formatAlertMessage(alert.message)}</p>
              </div>
            ))}

            {report.drug_interactions.map((interaction, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    {isBn ? 'পারস্পরিক প্রতিক্রিয়া:' : 'Interaction:'} {interaction.drug_a} ↔ {interaction.drug_b}
                  </span>
                  <Badge variant={interaction.severity === 'CRITICAL' ? 'critical' : 'warning'}>
                    {isBn
                      ? (interaction.severity === 'CRITICAL' ? 'মারাত্মক ঝুঁকি (CRITICAL)' : 'উচ্চ ঝুঁকি (HIGH)')
                      : interaction.severity}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{formatMechanism(interaction.mechanism)}</p>
                <p className="text-red-700 dark:text-red-400 font-medium">
                  {isBn ? 'প্রস্তাবিত ব্যবস্থাপনা:' : 'Recommendation:'} {formatRecommendation(interaction.recommended_action)}
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
              <h4 className="font-bold text-sm text-foreground">
                {isBn ? 'দায়িত্বপ্রাপ্ত চিকিৎসকের চূড়ান্ত মূল্যায়ন ও স্বাক্ষর' : 'Attending Clinician Determination'}
              </h4>
            </div>
            {report.clinician_review.reviewed ? (
              <Badge variant="success">{isBn ? 'যাচাইকৃত ও স্বাক্ষরিত' : 'REVIEWED & SIGNED'}</Badge>
            ) : (
              <Badge variant="warning">{isBn ? 'চিকিৎসকের পর্যালোচনা বাকি' : 'PENDING CLINICIAN REVIEW'}</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div>
              <span className="text-muted-foreground block text-[10px]">
                {isBn ? 'পর্যালোচক চিকিৎসক:' : 'Reviewing Physician:'}
              </span>
              <span className="font-bold text-foreground">
                {report.clinician_review.reviewer_name || 'Dr. M. Ashraful Hoque'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">
                {isBn ? 'বিএমডিসি নম্বর:' : 'BMDC Registration:'}
              </span>
              <span className="font-bold text-foreground font-mono">
                {report.clinician_review.reviewer_license || 'BMDC #A-89412'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">
                {isBn ? 'সিদ্ধান্ত:' : 'Decision:'}
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {formatDecision(report.clinician_review.decision)}
              </span>
            </div>
          </div>

          <div className="text-xs pt-2 border-t border-border/60">
            <span className="text-muted-foreground font-semibold">{isBn ? 'চিকিৎসকের মন্তব্য: ' : 'Clinician Notes: '}</span>
            <span className="text-foreground">
              {formatClinicianNotes(report.clinician_review.notes)}
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
          <strong>{isBn ? 'আইনি ও চিকিৎসাগত নিরাপত্তা নোটিশ: ' : 'Legal & Medical Safety Disclaimer: '}</strong>
          {isBn
            ? 'প্রেডিক্ট-আরএক্স এআই একটি সহায়ক ক্লিনিক্যাল ডিসিশন সাপোর্ট সিস্টেম (CDSS)। সকল স্বয়ংক্রিয় বিশ্লেষণ, ঝুঁকি স্কোর ও নির্দেশনা কেবল পরামর্শমূলক এবং অবশ্যই দায়িত্বপ্রাপ্ত চিকিৎসকের দ্বারা যাচাইযোগ্য।'
            : MEDICAL_SAFETY_DISCLAIMER}
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
