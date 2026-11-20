import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  UploadCloud,
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Stethoscope,
  Activity,
  Printer,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Eye,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShapWaterfallChart } from '@/components/clinical/ShapWaterfallChart';
import { RiskGaugeCard } from '@/components/clinical/RiskGaugeCard';
import { BanglaPatientCompanion } from '@/components/clinical/BanglaPatientCompanion';
import { ClinicianReviewModal } from '@/components/clinical/ClinicianReviewModal';
import { DemoScenarioSwitcher } from '@/components/clinical/DemoScenarioSwitcher';
import { analyzePrescription, fetchScenarioAnalysis } from '@/services/prescriptionService';
import { PatientContext, PrescriptionAnalysisResult } from '@/types';
import { MEDICAL_SAFETY_DISCLAIMER, GOLDEN_DEMO_SCENARIOS, GoldenDemoScenario, DEMO_PATIENTS_LIST } from '@/constants';
import {
  translateIssueCode,
  translateIssueMessage,
  translateFormText,
  translateTimingText,
  CLINICAL_INTERACTIONS_MAP_BN,
  CLINICAL_ALTERNATIVES_MAP_BN,
} from '@/utils/clinicalTranslations';
import { toast } from 'sonner';

// Validation schema for patient context form
const patientFormSchema = z.object({
  patient_id: z.string().optional(),
  name: z.string().optional(),
  age: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(1, 'Age must be valid').max(120, 'Age must be realistic').optional()
  ),
  gender: z.enum(['Male', 'Female', 'Other']).default('Male'),
  weight_kg: z.coerce.number().optional(),
  creatinine: z.coerce.number().optional(),
  egfr: z.coerce.number().optional(),
  hba1c: z.coerce.number().optional(),
  systolic_bp: z.coerce.number().optional(),
  diastolic_bp: z.coerce.number().optional(),
  conditions_text: z.string().optional(),
  current_meds_text: z.string().optional(),
  allergies_text: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const WORKFLOW_STAGES = [
  'Prescription Uploaded & Validated',
  'Vision OCR Text Extraction',
  'Prescription Syntax Validation',
  'Bangladesh Medicine Normalization',
  'Drug-Drug Interaction Detection',
  'Clinical Evidence Retrieval (KDIGO/BNF)',
  'Risk Prediction Assessment',
  'Explainability & SHAP Analysis',
  'Clinician Decision Support Report',
];

export const PrescriptionAnalysisPage: React.FC = () => {
  const { t, i18n } = useTranslation(['analysis', 'common']);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // File states
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Workflow states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<PrescriptionAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('clinical');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [showReferenceCases, setShowReferenceCases] = useState<boolean>(() => {
    return searchParams.get('demo') === 'true' || searchParams.get('scenarios') === 'true';
  });

  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));

  // Form setup - Empty and clean by default
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema) as any,
    defaultValues: {
      patient_id: '',
      name: '',
      age: '' as any,
      gender: 'Male',
      weight_kg: '' as any,
      creatinine: '' as any,
      egfr: '' as any,
      hba1c: '' as any,
      systolic_bp: '' as any,
      diastolic_bp: '' as any,
      conditions_text: '',
      current_meds_text: '',
      allergies_text: '',
    },
  });

  // Pre-fill demo scenario ONLY if explicitly requested via query param
  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      setShowReferenceCases(true);
      loadDemoData();
    }
  }, [searchParams]);

  const handleSelectScenario = async (scenario: GoldenDemoScenario, instantRun: boolean = false) => {
    setActiveScenarioId(scenario.scenario_id);

    // 1. Populate form fields
    const ctx = scenario.patient_context;
    setValue('patient_id', ctx.patient_id || '');
    setValue('name', ctx.name || '');
    setValue('age', ctx.age);
    setValue('gender', (ctx.gender as any) || 'Male');
    setValue('weight_kg', ctx.weight_kg);
    setValue('creatinine', ctx.creatinine);
    setValue('egfr', ctx.egfr);
    setValue('hba1c', ctx.hba1c);
    setValue('systolic_bp', ctx.systolic_bp);
    setValue('diastolic_bp', ctx.diastolic_bp);
    setValue('conditions_text', ctx.conditions?.join(', ') || '');
    setValue('current_meds_text', ctx.current_medications?.join(', ') || '');
    setValue('allergies_text', ctx.allergies?.join(', ') || '');

    // 2. Set sample file preview
    const sampleBlob = new Blob(['sample-prescription-image-bytes'], { type: 'image/jpeg' });
    const sampleFile = new File([sampleBlob], scenario.sample_file_name, { type: 'image/jpeg' });
    setFile(sampleFile);
    setFilePreview(scenario.preview_image);

    if (instantRun) {
      setIsAnalyzing(true);
      setCurrentStageIndex(WORKFLOW_STAGES.length - 1);
      try {
        const result = await fetchScenarioAnalysis(scenario.scenario_id);
        setAnalysisResult(result);
        toast.success(`Executed Fast-Path Evaluation for ${scenario.title} (${result.meta.latency_ms}ms)`);
      } catch {
        setAnalysisResult(scenario.analysis_result);
        toast.success(`Loaded pre-computed result for ${scenario.title}`);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      toast.success(
        isBn
          ? `${scenario.title}-এর প্রোফাইল লোড হয়েছে। মূল্যায়ন করতে নিচের বাটনে ক্লিক করুন।`
          : `Autofilled profile for ${scenario.title}. Click "Run Safety Evaluation" to process.`
      );
    }
  };

  const loadDemoData = () => {
    setShowReferenceCases(true);
    const defaultScenario = GOLDEN_DEMO_SCENARIOS[0];
    handleSelectScenario(defaultScenario, false);
  };

  const handleResetForm = () => {
    reset({
      patient_id: '',
      name: '',
      age: '' as any,
      gender: 'Male',
      weight_kg: '' as any,
      creatinine: '' as any,
      egfr: '' as any,
      hba1c: '' as any,
      systolic_bp: '' as any,
      diastolic_bp: '' as any,
      conditions_text: '',
      current_meds_text: '',
      allergies_text: '',
    });
    setFile(null);
    if (filePreview && !filePreview.startsWith('http')) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
    setActiveScenarioId(null);
    setAnalysisResult(null);
    toast.info(isBn ? 'ফর্ম সফলভাবে খালি করা হয়েছে।' : 'Form reset successfully.');
  };

  const handleSelectExistingPatient = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patientId = e.target.value;
    if (!patientId) return;
    const patient = DEMO_PATIENTS_LIST.find((p) => p.id === patientId);
    if (!patient) return;

    setValue('patient_id', patient.id);
    setValue('name', patient.name);
    setValue('age', patient.age);
    setValue('gender', (patient.gender as any) || 'Male');
    setValue('creatinine', patient.creatinine);
    setValue('egfr', patient.egfr);
    setValue('hba1c', patient.hba1c);
    setValue('conditions_text', patient.conditions?.join(', ') || '');
    setValue('allergies_text', patient.allergies?.join(', ') || '');
    toast.success(
      isBn
        ? `রোগী ${patient.name}-এর প্রোফাইল লোড করা হয়েছে`
        : `Loaded clinical profile for ${patient.name}`
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file format. Please upload JPG, PNG, WEBP, or PDF.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File exceeds 10MB size limit.');
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
    toast.success(`Selected file: ${selectedFile.name}`);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (filePreview && !filePreview.startsWith('http')) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
  };

  const onSubmit = async (values: PatientFormValues) => {
    if (!file) {
      toast.error('Please attach or drop a prescription image to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setCurrentStageIndex(0);

    const patientContext: PatientContext = {
      patient_id: values.patient_id,
      name: values.name,
      age: values.age || 45,
      gender: values.gender,
      weight_kg: values.weight_kg,
      creatinine: values.creatinine,
      egfr: values.egfr,
      hba1c: values.hba1c,
      systolic_bp: values.systolic_bp,
      diastolic_bp: values.diastolic_bp,
      conditions: values.conditions_text
        ? values.conditions_text.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      current_medications: values.current_meds_text
        ? values.current_meds_text.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      allergies: values.allergies_text
        ? values.allergies_text.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    // Staged progression animation for clinical explainability
    const isTestMode = import.meta.env.MODE === 'test';
    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < WORKFLOW_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, isTestMode ? 20 : 280);

    try {
      const result = await analyzePrescription(file, patientContext);
      clearInterval(stageInterval);
      setCurrentStageIndex(WORKFLOW_STAGES.length - 1);
      setAnalysisResult(result);
      toast.success('Prescription analysis & safety evaluation completed.');
    } catch (err: unknown) {
      clearInterval(stageInterval);
      const errMsg = err instanceof Error ? err.message : 'Analysis failed';
      toast.error(`Analysis failed: ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Reference Cases Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <span>{t('title', 'Prescription OCR & Clinical Safety Analysis')}</span>
            <Badge variant="outline" className="text-xs border-teal-500/30 text-teal-600 dark:text-teal-400 font-mono">
              CDSS Engine v1.4
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('subtitle', 'Extract handwritten/printed BD prescriptions, validate dosing syntax, and predict patient-specific pharmacotherapy risks.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant={showReferenceCases ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowReferenceCases(!showReferenceCases)}
            className="text-xs flex items-center space-x-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {showReferenceCases
                ? (isBn ? 'কেস লুকান ▲' : 'Hide Sample Cases ▲')
                : (isBn ? 'নমুনা কেস দেখুন (৫টি) ▼' : 'Sample Clinical Cases (5) ▼')}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadDemoData}
            className="border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs flex items-center space-x-1.5"
          >
            <span>{t('scenarios.loadDemoBtn', 'Load Reference Case (CKD 3 / Ketorolac)')}</span>
          </Button>
        </div>
      </div>

      {/* Collapsible Reference Cases Panel - Only shown when requested */}
      {showReferenceCases && (
        <div className="rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/20 dark:bg-teal-950/20 p-4 transition animate-in fade-in duration-200">
          <DemoScenarioSwitcher
            activeScenarioId={activeScenarioId}
            onSelectScenario={handleSelectScenario}
            isLoading={isAnalyzing}
          />
        </div>
      )}

      {/* Upload and Patient Context Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Upload Zone (5 cols) */}
          <Card className="lg:col-span-5 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <UploadCloud className="h-4 w-4 text-primary" />
                <span>{t('upload.title', '1. Upload Prescription Document')}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {t('upload.description', 'Supports JPG, PNG, WEBP, or scanned clinical PDF (Max 10MB).')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition text-center cursor-pointer ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                  onClick={() => document.getElementById('prescription-upload-input')?.click()}
                >
                  <div className="p-3 rounded-full bg-teal-50 dark:bg-teal-950/60 text-primary mb-2">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {t('upload.dropPrompt', 'Click to select or drag & drop prescription')}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {t('upload.description', 'Bangla handwriting, printed hospital Rx, or camera snap')}
                  </p>
                  <input
                    id="prescription-upload-input"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="relative rounded-xl border border-border p-3 bg-muted/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden text-left">
                        <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB • {file.type || 'Document'}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="h-7 w-7 text-muted-foreground hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {filePreview && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border max-h-48 flex items-center justify-center bg-black/5">
                      <img
                        src={filePreview}
                        alt="Prescription preview"
                        className="object-contain max-h-48 w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="text-[11px] text-muted-foreground flex items-center space-x-1.5">
                <FileCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{t('upload.enhancementNotice', 'Includes automated image contrast enhancement & rotation normalization.')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Patient Clinical Context Form (7 cols) */}
          <Card className="lg:col-span-7 border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center space-x-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    <span>{t('patientForm.title', '2. Patient Baseline Clinical Profile')}</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {t('patientForm.subtitle', 'Essential for contraindication screening (renal eGFR, diabetic control, and comorbidities).')}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetForm}
                    className="text-xs h-8 border-dashed hover:border-solid text-muted-foreground hover:text-foreground flex items-center space-x-1"
                    title={isBn ? 'সব ফিল্ড খালি করুন' : 'Clear all fields'}
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{isBn ? 'ফর্ম খালি করুন' : 'Clear Form'}</span>
                  </Button>
                  {/* Registered Patient Quick Picker */}
                  <select
                    aria-label={isBn ? 'নিবন্ধিত রোগী নির্বাচন করুন' : 'Select Registered Patient'}
                    onChange={handleSelectExistingPatient}
                    className="text-xs rounded-md border border-input bg-background px-2.5 py-1 text-muted-foreground hover:text-foreground focus:ring-1 focus:ring-primary"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {isBn ? '📋 রেজিস্ট্রি থেকে রোগী নির্বাচন (ঐচ্ছিক)' : '📋 Select Registered Patient (Optional)'}
                    </option>
                    {DEMO_PATIENTS_LIST.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id}) • {p.age}y/{p.gender.charAt(0)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('patientForm.patientId', 'Patient Identifier')}</label>
                  <Input {...register('patient_id')} className="mt-1 text-xs" placeholder="PRX-BD-..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('patientForm.name', 'Patient Name')}</label>
                  <Input {...register('name')} className="mt-1 text-xs" placeholder={t('patientForm.namePlaceholder', 'Full Name')} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('patientForm.age', 'Age (Years)')} *</label>
                  <Input
                    type="number"
                    {...register('age')}
                    className="mt-1 text-xs"
                    placeholder="e.g. 62"
                  />
                  {errors.age && <p className="text-[10px] text-red-500 mt-0.5">{errors.age.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('patientForm.gender', 'Gender')}</label>
                  <select
                    {...register('gender')}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  >
                    <option value="Male">{t('patientForm.genderMale', 'Male')}</option>
                    <option value="Female">{t('patientForm.genderFemale', 'Female')}</option>
                    <option value="Other">{t('patientForm.genderOther', 'Other')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('patientForm.creatinine', 'Creatinine (mg/dL)')}</label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('creatinine')}
                    className="mt-1 text-xs"
                    placeholder="e.g. 2.1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('patientForm.egfr', 'eGFR (mL/min)')}</label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('egfr')}
                    className="mt-1 text-xs"
                    placeholder="e.g. 34.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('patientForm.hba1c', 'HbA1c (%)')}</label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('hba1c')}
                    className="mt-1 text-xs"
                    placeholder="e.g. 8.4"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">{t('patientForm.conditions', 'Known Diagnoses / Conditions')}</label>
                <Input
                  {...register('conditions_text')}
                  className="mt-1 text-xs"
                  placeholder={t('patientForm.conditionsPlaceholder', 'Comma separated: CKD Stage 3, Hypertension, Type 2 Diabetes')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('patientForm.currentMeds', 'Current Active Medications')}</label>
                  <Input
                    {...register('current_meds_text')}
                    className="mt-1 text-xs"
                    placeholder={t('patientForm.currentMedsPlaceholder', 'e.g. Metformin 500mg, Atorvastatin 10mg')}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('patientForm.allergies', 'Documented Drug Allergies')}</label>
                  <Input
                    {...register('allergies_text')}
                    className="mt-1 text-xs"
                    placeholder={t('patientForm.allergiesPlaceholder', 'e.g. Penicillin, Sulfa')}
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetForm}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  <span>{isBn ? 'ফর্ম খালি করুন (Reset)' : 'Clear Form (Reset)'}</span>
                </Button>

                <Button
                  type="submit"
                  size="default"
                  disabled={isAnalyzing || !file}
                  className="w-full sm:w-auto font-semibold flex items-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{t('patientForm.btnAnalyzing', 'Executing Clinical Analysis Pipeline...')}</span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4" />
                      <span>{t('patientForm.btnAnalyze', 'Run Full CDSS Safety Evaluation')}</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Multi-Stage Pipeline Progress Indicator */}
      {isAnalyzing && (
        <Card className="border-teal-300 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20 p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950 dark:text-teal-200">
                Pipeline Stage {currentStageIndex + 1} of {WORKFLOW_STAGES.length}:{' '}
                <span className="text-primary">{WORKFLOW_STAGES[currentStageIndex]}</span>
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(((currentStageIndex + 1) / WORKFLOW_STAGES.length) * 100)}%
              </span>
            </div>
            <Progress
              value={((currentStageIndex + 1) / WORKFLOW_STAGES.length) * 100}
              className="h-2 bg-teal-100 dark:bg-teal-950"
            />
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 text-[10px] text-muted-foreground pt-1">
              {WORKFLOW_STAGES.map((stage, idx) => (
                <div
                  key={idx}
                  className={`p-1 rounded text-center truncate ${
                    idx <= currentStageIndex ? 'font-semibold text-primary' : 'opacity-40'
                  }`}
                  title={stage}
                >
                  {stage.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          {/* Prescription-Level Alerts (API Key, Quota, OCR Failures) */}
          {analysisResult.prescription_level_alerts && analysisResult.prescription_level_alerts.length > 0 && (
            <div className="space-y-3">
              {analysisResult.prescription_level_alerts.map((alert, idx) => (
                <Alert
                  key={idx}
                  variant={alert.severity === 'CRITICAL' ? 'critical' : 'warning'}
                  className={alert.code === 'AI_API_KEY_INVALID' ? 'border-amber-500/80 bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100' : ''}
                >
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-sm font-bold flex items-center space-x-2">
                    <span>
                      {alert.code === 'AI_API_KEY_INVALID'
                        ? (isBn ? '⚠️ এআই এপিআই কী সতর্কতা (AI Key Not Valid / 401)' : '⚠️ AI Service Alert: API Key Not Valid (401)')
                        : alert.code === 'AI_API_QUOTA_EXCEEDED'
                        ? (isBn ? '⚠️ এআই সার্ভিস কোটা শেষ (Quota Exceeded / 429)' : '⚠️ AI API Quota Exceeded (429)')
                        : (isBn ? 'প্রেসক্রিপশন সতর্কতা' : 'Prescription Alert')}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono uppercase ml-2">
                      {alert.severity}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="text-xs mt-1.5 leading-relaxed">
                    {alert.code === 'AI_API_KEY_INVALID' && isBn
                      ? 'আপনার দেওয়া Google Gemini API Key কার্যকর হচ্ছে না বা মেয়াদোত্তীর্ণ (401 Unauthorized)। অনুগ্রহ করে .env ফাইলে একটি সচল এপিআই কী যুক্ত করে ব্যাকএন্ড রিস্টার্ট করুন। ডেমো স্যাম্পল টেস্ট করতে ওপরের "নমুনা কেস দেখুন" বাটনে ক্লিক করুন।'
                      : alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Clinical Alert Top Banner if Critical */}
          {analysisResult.clinical_risk?.risk_classification === 'CRITICAL' && (
            <Alert variant="critical">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-sm font-bold text-red-900 dark:text-red-200">
                {isBn
                  ? 'গুরুতর নিরাপত্তা সতর্কতা: উচ্চ ঝুঁকিপূর্ণ প্রেসক্রিপশন শনাক্ত হয়েছে'
                  : 'Critical Safety Alert: High-Risk Prescription Detected'}
              </AlertTitle>
              <AlertDescription className="text-xs text-red-800 dark:text-red-300 mt-1">
                {isBn
                  ? (analysisResult.prescription_id?.includes('TRIPLE') || (analysisResult as any).alerts?.some((a: any) => a.code?.includes('TRIPLE'))
                      ? 'জরুরি সতর্কতা: প্রেসক্রিপশনে উচ্চ রক্তচাপের ওষুধ (Ramipril), পানির ওষুধ (Lasix) এবং ব্যথার ওষুধ (Diclofenac) একত্রে রয়েছে। চিকিৎসাবিজ্ঞানে একে "ট্রিপল হোয়ামি" বলা হয়—যা আকস্মিকভাবে কিডনি অকেজো করে দেয়। ব্যথার ওষুধটি বাদ দিয়ে নিরাপদ বিকল্প ব্যবহার আবশ্যক।'
                      : (analysisResult.extracted_prescription || []).some((m) => m.brand_name.toLowerCase().includes('aspirin') || m.brand_name.toLowerCase().includes('ecospirin'))
                      ? 'গুরুতর সতর্কতা: ভাইরাল জ্বরে আক্রান্ত শিশুর ক্ষেত্রে অ্যাসপিরিন সেবনে প্রাণঘাতী রে সিন্ড্রোমের মারাত্মক ঝুঁকি রয়েছে। অনতিবিলম্বে চিকিৎসকের বিকল্প ওষুধ নির্ধারণ প্রয়োজন।'
                      : (analysisResult.extracted_prescription || []).some((m) => m.brand_name.toLowerCase().includes('rolac') || m.brand_name.toLowerCase().includes('ketorolac') || m.generic_name?.toLowerCase().includes('ketorolac'))
                      ? 'কিটোরোলাক (Rolac 10) ১৪ দিনের মেয়াদ সর্বোচ্চ সুরক্ষা সীমা অতিক্রম করেছে এবং রোগীর সিকেডি স্টেজ ৩ (eGFR 34.5)-এর ক্ষেত্রে সম্পূর্ণ নিষিদ্ধ। একই সাথে ওলমেসারটান সেবনে তীব্র কিডনি ক্ষতির (AKI) ঝুঁকি বাড়িয়ে দেয়। অনতিবিলম্বে চিকিৎসকের বিকল্প ওষুধ নির্ধারণ প্রয়োজন।'
                      : (analysisResult.clinical_risk?.calibrated_probability_note || 'প্রেসক্রিপশনে ঝুঁকিপূর্ণ ওষুধের সংমিশ্রণ পাওয়া গেছে। তাৎক্ষণিক চিকিৎসকের পর্যালোচনা প্রয়োজন।'))
                  : (analysisResult.prescription_id?.includes('TRIPLE')
                      ? 'Triple Whammy detected: Concomitant ACEi/ARB + Diuretic + NSAID creates high risk of acute kidney injury.'
                      : (analysisResult.extracted_prescription || []).some((m) => m.brand_name.toLowerCase().includes('aspirin') || m.brand_name.toLowerCase().includes('ecospirin'))
                      ? 'Pediatric Aspirin contraindicated: high risk of fatal Reye syndrome.'
                      : (analysisResult.extracted_prescription || []).some((m) => m.brand_name.toLowerCase().includes('rolac') || m.brand_name.toLowerCase().includes('ketorolac') || m.generic_name?.toLowerCase().includes('ketorolac'))
                      ? "Ketorolac (Rolac 10) 14-day duration exceeds safety ceilings and is contraindicated in patient's CKD Stage 3 (eGFR 34.5). Concomitant Olmesartan increases Acute Kidney Injury hazard. Immediate clinician substitution required."
                      : (analysisResult.clinical_risk?.calibrated_probability_note || 'High-risk medication combination detected. Immediate clinician review required.'))}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Bar for Clinician */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="font-mono text-xs">
                {analysisResult.prescription_id}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {isBn ? 'মূল্যায়িত:' : 'Evaluated:'} {new Date(analysisResult.timestamp).toLocaleTimeString()}{' '}
                • {isBn ? 'ইঞ্জিন:' : 'Engine:'}{' '}
                {isBn && analysisResult.meta.ocr_engine.includes('PredictRx Smart Offline Cache')
                  ? 'প্রেডিক্ট-আরএক্স স্মার্ট অফলাইন ক্যাশ (ফেল-সেফ)'
                  : analysisResult.meta.ocr_engine}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs"
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                {isBn ? 'সিডিএসএস কার্ড প্রিন্ট করুন' : 'Print CDSS Card'}
              </Button>
              <Button
                size="sm"
                onClick={() => setIsReviewModalOpen(true)}
                className="text-xs bg-primary text-primary-foreground font-semibold"
              >
                <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
                {t('results.review.button', 'Clinician Sign-Off & Audit')}
              </Button>
            </div>
          </div>

          {/* Tabbed Results Layout */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto w-full sm:w-[540px] gap-1 p-1">
              <TabsTrigger value="clinical" className="text-xs py-1.5">{t('results.tabs.medications', 'Clinical Findings')}</TabsTrigger>
              <TabsTrigger value="interactions" className="text-xs py-1.5">{t('results.tabs.interactions', 'Interactions')} ({analysisResult.drug_interactions.length})</TabsTrigger>
              <TabsTrigger value="risk" className="text-xs py-1.5">{t('results.tabs.risk', 'SHAP Explainability')}</TabsTrigger>
              <TabsTrigger value="bangla" className="text-xs py-1.5">{t('results.tabs.companion', isBn ? 'রোগীর নির্দেশিকা' : 'Patient Companion')}</TabsTrigger>
            </TabsList>

            {/* TAB 1: Clinical Findings & Normalization */}
            <TabsContent value="clinical" className="space-y-6 mt-4">
              {/* Extracted Medicines Table */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">
                        {t('results.title', 'Prescription Medicines & Deterministic Syntax Checks')}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t('subtitle', 'Bangladesh brand name normalization, dosage syntax, and rule-based safety ceiling checks.')}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {analysisResult.extracted_prescription.length} Medications
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 border-y border-border text-muted-foreground">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">{t('results.medTable.brand', 'Brand (Written)')}</th>
                          <th className="py-2.5 px-4 font-semibold">{t('results.medTable.generic', 'Generic Normalized')}</th>
                          <th className="py-2.5 px-4 font-semibold">{t('results.medTable.syntax', 'Dosage & Syntax')}</th>
                          <th className="py-2.5 px-4 font-semibold">{t('results.medTable.duration', 'Duration')}</th>
                          <th className="py-2.5 px-4 font-semibold">{t('results.medTable.status', 'Safety Status')}</th>
                          <th className="py-2.5 px-4 font-semibold">{isBn ? 'শনাক্তকৃত সমস্যা / সতর্কতা' : 'Issues Flagged'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {analysisResult.extracted_prescription.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 px-4 text-center text-muted-foreground">
                              <p className="text-sm font-medium">
                                {isBn ? 'কোনো ওষুধ শনাক্ত করা যায়নি' : 'No medications detected or extracted'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {isBn
                                  ? 'প্রেসক্রিপশন এআই এক্সট্রাকশন সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে এআই এপিআই কী (.env) অথবা ছবির স্বচ্ছতা পরীক্ষা করুন।'
                                  : 'Could not extract medications from image. Please verify your Gemini API key in .env or upload a clearer image.'}
                              </p>
                            </td>
                          </tr>
                        ) : (
                          analysisResult.extracted_prescription.map((med, idx) => (
                          <tr key={idx} className={med.issues.some((i) => i.severity === 'CRITICAL') ? 'bg-red-50/30 dark:bg-red-950/20' : ''}>
                            <td className="py-3 px-4 font-semibold text-foreground">
                              {med.brand_name}
                              <span className="block text-[10px] text-muted-foreground">
                                {isBn ? 'ধরন:' : 'Form:'} {translateFormText(med.form || undefined, isBn)} • {isBn ? 'মাত্রা:' : 'Strength:'} {med.strength || (isBn ? 'প্রযোজ্য নয়' : 'N/A')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-teal-800 dark:text-teal-300">
                              {med.generic_name || 'Unmapped Brand'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-semibold">{med.dosage_syntax || 'N/A'}</span>
                              <span className="block text-[10px] text-muted-foreground">{translateTimingText(med.timing || undefined, isBn)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={med.duration_days && med.duration_days > 5 && (med.generic_name?.toLowerCase().includes('ketorolac') || /rolac|torax|ketonic/i.test(med.brand_name)) ? 'font-bold text-red-600 dark:text-red-400' : ''}>
                                {med.duration_days ? `${med.duration_days} ${isBn ? 'দিন' : 'days'}` : (isBn ? 'চলমান' : 'Continue')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {med.syntax_valid ? (
                                <Badge variant="success" className="text-[10px]">
                                  {isBn ? 'সঠিক গঠন' : 'Valid Syntax'}
                                </Badge>
                              ) : (
                                <Badge variant="critical" className="text-[10px]">
                                  {isBn ? 'সীমা অতিক্রান্ত' : 'Ceiling Exceeded'}
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 space-y-1">
                              {med.issues.length === 0 ? (
                                <span className="text-muted-foreground">{isBn ? 'কোনো সমস্যা নেই' : 'None'}</span>
                              ) : (
                                med.issues.map((issue, iIdx) => (
                                  <div
                                    key={iIdx}
                                    className={`text-[11px] p-1.5 rounded ${
                                      issue.severity === 'CRITICAL'
                                        ? 'bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-200'
                                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200'
                                    }`}
                                  >
                                    <strong className="block font-semibold">{translateIssueCode(issue.code, isBn)}:</strong>
                                    <span>{translateIssueMessage(issue.message, isBn)}</span>
                                  </div>
                                ))
                              )}
                            </td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Safer Alternatives Section */}
              {analysisResult.safer_alternatives.length > 0 && (
                <Card className="border-emerald-300 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center space-x-2">
                      <Stethoscope className="h-4 w-4 text-emerald-600" />
                      <span>{t('results.safer.title', 'Safer Therapeutic Alternatives for Clinician Consideration')}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t('results.safer.subtitle', 'Evidence-backed medication substitutions to resolve identified contraindications.')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysisResult.safer_alternatives.map((alt, idx) => {
                      const bnAlt = isBn ? CLINICAL_ALTERNATIVES_MAP_BN[alt.original_brand] : null;
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-card"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-xs text-red-600 line-through mr-2 font-medium">
                                {isBn ? 'বিকল্প নির্ধারণ:' : 'Replace:'} {alt.original_brand}
                              </span>
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                → {isBn ? 'সুপারিশকৃত:' : 'Recommended:'} {alt.alternative_brand} ({alt.alternative_generic})
                              </span>
                            </div>
                            <Badge variant="success" className="text-[10px]">
                              {isBn ? 'কিডনি-বান্ধব (Renal-sparing)' : 'Renal-sparing'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            <strong>{isBn ? 'চিকিৎসাগত কারণ: ' : 'Rationale: '}</strong>
                            {bnAlt?.rationale || alt.clinical_rationale}
                          </p>
                          <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                            <strong>{isBn ? 'সুরক্ষাগত সুবিধা: ' : 'Safety Benefit: '}</strong>
                            {bnAlt?.safetyBenefit || alt.safety_benefit}
                          </p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 2: Drug-Drug Interactions */}
            <TabsContent value="interactions" className="space-y-4 mt-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center space-x-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <span>
                      {isBn
                        ? 'শনাক্তকৃত ওষুধের মিথস্ক্রিয়া ও ফার্মাকোভিজিল্যান্স নির্দেশনা'
                        : 'Detected Drug Interactions & Pharmacovigilance Advisories'}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isBn
                      ? 'প্রেসক্রাইবকৃত ওষুধ এবং রোগীর পূর্ববর্তী নিয়মিত ওষুধের মধ্যকার পারস্পরিক প্রভাব।'
                      : "Interplay between prescribed agents and patient's baseline medications."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisResult.drug_interactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-xl border-dashed border-emerald-500/30 bg-emerald-500/5 p-6">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {isBn
                          ? 'কোনো ক্ষতিকর ওষুধের মিথস্ক্রিয়া শনাক্ত হয়নি'
                          : 'No Adverse Drug-Drug Interactions Detected'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md">
                        {isBn
                          ? 'প্রেসক্রিপশনভুক্ত ওষুধসমূহ এবং রোগীর পূর্ববর্তী নিয়মিত ওষুধগুলোর মধ্যে কোনো বিপজ্জনক পারস্পরিক সংঘাত নেই। এগুলো একসাথে গ্রহণ করা চিকিৎসাগতভাবে নিরাপদ।'
                          : 'The prescribed medications and patient baseline therapy do not exhibit any documented adverse pharmacodynamic or pharmacokinetic collisions.'}
                      </p>
                    </div>
                  ) : (
                    analysisResult.drug_interactions.map((interaction) => {
                      const bnInter = isBn ? CLINICAL_INTERACTIONS_MAP_BN[interaction.id] : null;
                      return (
                        <div
                          key={interaction.id}
                          className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sm text-foreground">
                                {interaction.drug_a} ↔ {interaction.drug_b}
                              </span>
                            </div>
                            <Badge variant={interaction.severity === 'CRITICAL' ? 'critical' : 'warning'}>
                              {isBn
                                ? (interaction.severity === 'CRITICAL' ? 'গুরুতর প্রতিক্রিয়া (CRITICAL)' : 'সতর্কতামূলক (WARNING)')
                                : `${interaction.severity} SEVERITY`}
                            </Badge>
                          </div>

                          <div className="text-xs space-y-1.5">
                            <p className="text-muted-foreground">
                              <strong className="text-foreground">{isBn ? 'প্রক্রিয়া / মেকানিজম: ' : 'Mechanism: '}</strong>
                              {bnInter?.mechanism || interaction.mechanism}
                            </p>
                            <p className="text-muted-foreground">
                              <strong className="text-foreground">{isBn ? 'ক্লিনিক্যাল ঝুঁকি / ফলাফল: ' : 'Clinical Consequence: '}</strong>
                              {bnInter?.significance || interaction.clinical_significance}
                            </p>
                            <p className="text-amber-800 dark:text-amber-300">
                              <strong>{isBn ? 'প্রস্তাবিত পদক্ষেপ: ' : 'Recommended Action: '}</strong>
                              {bnInter?.action || interaction.recommended_action}
                            </p>
                            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                              <strong>{isBn ? 'প্রমাণের উৎস: ' : 'Evidence Source: '}</strong>
                              {bnInter?.source || interaction.evidence_source}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Explainable Risk & SHAP */}
            <TabsContent value="risk" className="space-y-6 mt-4">
              {analysisResult.clinical_risk && (
                <>
                  <RiskGaugeCard risk={analysisResult.clinical_risk} />
                  <ShapWaterfallChart
                    features={analysisResult.clinical_risk.shap_features || []}
                    isDemo={Boolean(analysisResult.clinical_risk.is_synthetic_demo)}
                  />
                </>
              )}
            </TabsContent>

            {/* TAB 4: Patient Companion */}
            <TabsContent value="bangla" className="mt-4">
              {analysisResult.bangla_companion ? (
                <BanglaPatientCompanion
                  data={analysisResult.bangla_companion}
                  patientName={analysisResult.patient_context?.name}
                  lang={isBn ? 'bn' : 'en'}
                />
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  {isBn ? 'বাংলা কমপ্যানিয়ন তথ্য পাওয়া যায়নি।' : 'Patient companion data not available.'}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Clinician Review Sign-Off Modal */}
      {analysisResult && (
        <ClinicianReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          analysisId={analysisResult.analysis_id}
          currentDecision={analysisResult.clinician_review.decision}
          onReviewSaved={() => {
            if (analysisResult) {
              setAnalysisResult({
                ...analysisResult,
                clinician_review: {
                  ...analysisResult.clinician_review,
                  reviewed: true,
                },
              });
            }
          }}
        />
      )}
    </div>
  );
};
