import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HeartHandshake,
  Volume2,
  VolumeX,
  Printer,
  Sparkles,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Languages,
  User,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BanglaPatientCompanion } from '@/components/clinical/BanglaPatientCompanion';
import { getPrescriptionById, getPrescriptionHistory } from '@/services/prescriptionService';
import { PrescriptionAnalysisResult } from '@/types';
import { DEMO_ANALYSIS_RESULT } from '@/constants';

export const BanglaCompanionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation(['common', 'navigation']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));
  const [prescriptions, setPrescriptions] = useState<PrescriptionAnalysisResult[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<PrescriptionAnalysisResult>(DEMO_ANALYSIS_RESULT);
  const [languageMode, setLanguageMode] = useState<'bilingual' | 'bn_only'>('bilingual');

  useEffect(() => {
    getPrescriptionHistory().then((data) => {
      setPrescriptions(data);
      if (id) {
        const found = data.find((p) => p.analysis_id === id || p.prescription_id === id);
        if (found) setSelectedAnalysis(found);
      }
    });
  }, [id]);

  const handleSelectPrescription = (analysisId: string) => {
    const found = prescriptions.find((p) => p.analysis_id === analysisId);
    if (found) {
      setSelectedAnalysis(found);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-800 to-emerald-900 text-white shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-emerald-400 text-teal-950 font-bold hover:bg-emerald-300">
              {isBn ? 'রোগী নির্দেশিকা ও লিফলেট' : 'Patient Medication Guide'}
            </Badge>
            <span className="text-xs text-teal-200">
              {isBn ? 'রোগী স্বাস্থ্য সচেতনতা ও সহজ পাঠ' : 'Patient-Centric Health Literacy'}
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {isBn ? 'সহজ রোগী ওষুধ নির্দেশিকা (Patient Medication Guide)' : 'Patient Medication Guide & Discharge Leaflet'}
          </h2>
          <p className="mt-1 text-xs text-teal-100/90 max-w-2xl leading-relaxed">
            {isBn
              ? 'প্রেসক্রিপশনের জটিল ডাক্তারি নির্দেশনা ও ল্যাটিন পরিভাষা (OD, BD, TDS, PC) সহজ বাংলায় রূপান্তর, সময়সূচি ও জরুরি কিডনি-লিভার সতর্কতা।'
              : 'Translating complex physician dosage syntax and Latin sigs (OD, BD, TDS, PRN) into clear patient dosing schedules and emergency safety guidance.'}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="bg-teal-900/60 border-teal-600 text-teal-100 hover:bg-teal-800"
          >
            <Link to="/analyze">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              {isBn ? 'নতুন প্রেসক্রিপশন বিশ্লেষণ' : 'Analyze New Prescription'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Prescription Selector bar */}
      <Card className="border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-foreground font-medium">
            <User className="h-4 w-4 text-primary" />
            <span>{isBn ? 'বর্তমান নির্বাচিত প্রেসক্রিপশন:' : 'Active Selected Prescription:'}</span>
            <span className="font-bold text-primary font-mono">{selectedAnalysis.prescription_id}</span>
            <span className="text-muted-foreground">({selectedAnalysis.patient_context.name})</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">{isBn ? 'অন্য প্রেসক্রিপশন দেখুন:' : 'Switch Prescription:'}</span>
            <select
              value={selectedAnalysis.analysis_id}
              onChange={(e) => handleSelectPrescription(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground"
            >
              {prescriptions.map((p) => (
                <option key={p.analysis_id} value={p.analysis_id}>
                  {p.prescription_id} — {p.patient_context.name || 'Anonymous'} ({p.clinical_risk.risk_classification})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Primary Bangla Patient Companion Component */}
      <BanglaPatientCompanion
        data={
          selectedAnalysis?.bangla_companion?.medicines?.length
            ? selectedAnalysis.bangla_companion
            : DEMO_ANALYSIS_RESULT.bangla_companion
        }
        patientName={selectedAnalysis?.patient_context?.name || 'মোঃ রফিকুল ইসলাম'}
      />

      {/* Clinical Guidance Notice for Healthcare Workers */}
      <Card className="border-border bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-2">
            <HeartHandshake className="h-4 w-4 text-primary" />
            <span>{isBn ? 'স্বাস্থ্যকর্মী ও চিকিৎসকদের জন্য পরামর্শ (Clinical Guidance for Dispensary)' : 'Clinical Guidance for Healthcare Workers & Dispensary'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
          <p>
            {isBn
              ? '১. রোগী বা তাদের অভিভাবককে ওষুধ বুঝিয়ে দেওয়ার সময় এই বাংলা নির্দেশিকার প্রিন্ট কপি বা অডিও শুনিয়ে ডোজ নিশ্চিত করুন।'
              : '1. Provide the patient or caregiver with this printed guide or text-to-speech audio when dispensing medications.'}
          </p>
          <p>
            {isBn
              ? '২. বিশেষ করে কিডনি রোগ (CKD), গর্ভকালীন ঝুঁকি বা লিভারের সমস্যায় ব্যথানাশক (NSAIDs) সেবনের ক্ষেত্রে নির্দেশিত সর্বোচ্চ দিনের সীমা (যেমন রোলাক সর্বোচ্চ ৫ দিন) রোগীকে স্পষ্টভাবে মনে করিয়ে দিন।'
              : '2. Especially in patients with CKD, pregnancy, or hepatic impairment, explicitly emphasize duration ceilings for NSAIDs (e.g., Ketorolac max 5 days).'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
