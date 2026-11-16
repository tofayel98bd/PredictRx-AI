import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { MEDICAL_SAFETY_DISCLAIMER, GOLDEN_DEMO_SCENARIOS, GoldenDemoScenario } from '@/constants';
import { toast } from 'sonner';

// Validation schema for patient context form
const patientFormSchema = z.object({
  patient_id: z.string().optional(),
  name: z.string().optional(),
  age: z.coerce.number().min(1, 'Age must be valid').max(120, 'Age must be realistic'),
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
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>('GOLDEN_01_CKD_KETOROLAC');

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema) as any,
    defaultValues: {
      patient_id: 'PRX-BD-2026-081',
      name: 'Md. Rafiqul Islam (Demo)',
      age: 62,
      gender: 'Male',
      weight_kg: 68,
      creatinine: 2.1,
      egfr: 34.5,
      hba1c: 8.4,
      systolic_bp: 148,
      diastolic_bp: 92,
      conditions_text: 'Type 2 Diabetes, Chronic Kidney Disease (CKD Stage 3), Hypertension',
      current_meds_text: 'Metformin 500mg BD, Atorvastatin 10mg HS',
      allergies_text: 'Penicillin',
    },
  });

  // Pre-fill demo scenario if queried
  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
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
      toast.success(`Autofilled profile for ${scenario.title}. Click "Run Safety Evaluation" to process.`);
    }
  };

  const loadDemoData = () => {
    const defaultScenario = GOLDEN_DEMO_SCENARIOS[0];
    handleSelectScenario(defaultScenario, false);
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
      age: values.age,
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
      {/* Top Header & Demo Quick Loader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <span>Prescription OCR & Clinical Safety Analysis</span>
            <Badge variant="demo">Dual AI + Rules Engine</Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Extract handwritten/printed BD prescriptions, validate dosing syntax, and predict patient-specific pharmacotherapy risks.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadDemoData}
          className="border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs flex items-center space-x-1.5 self-start"
        >
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          <span>Load Hackathon Demo Scenario (CKD 3 / Ketorolac)</span>
        </Button>
      </div>

      {/* 1-Click 3 Golden Demo Scenarios Switcher */}
      <DemoScenarioSwitcher
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        isLoading={isAnalyzing}
      />

      {/* Upload and Patient Context Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Upload Zone (5 cols) */}
          <Card className="lg:col-span-5 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <UploadCloud className="h-4 w-4 text-primary" />
                <span>1. Upload Prescription Document</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Supports JPG, PNG, WEBP, or scanned clinical PDF (Max 10MB).
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
                    Click to select or drag & drop prescription
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Bangla handwriting, printed hospital Rx, or camera snap
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
                <span>Includes automated image contrast enhancement & rotation normalization.</span>
              </div>
            </CardContent>
          </Card>

          {/* Patient Clinical Context Form (7 cols) */}
          <Card className="lg:col-span-7 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span>2. Patient Baseline Clinical Profile</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Essential for contraindication screening (renal eGFR, diabetic control, and comorbidities).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Patient Identifier</label>
                  <Input {...register('patient_id')} className="mt-1 text-xs" placeholder="PRX-BD-..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Patient Name (Optional)</label>
                  <Input {...register('name')} className="mt-1 text-xs" placeholder="Full Name" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Age (Years) *</label>
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
                  <label className="text-xs font-semibold text-foreground">Gender</label>
                  <select
                    {...register('gender')}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Creatinine (mg/dL)</label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('creatinine')}
                    className="mt-1 text-xs"
                    placeholder="e.g. 2.1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">eGFR (mL/min)</label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('egfr')}
                    className="mt-1 text-xs"
                    placeholder="e.g. 34.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">HbA1c (%)</label>
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
                <label className="text-xs font-semibold text-foreground">Known Diagnoses / Conditions</label>
                <Input
                  {...register('conditions_text')}
                  className="mt-1 text-xs"
                  placeholder="Comma separated: CKD Stage 3, Hypertension, Type 2 Diabetes"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Current Active Medications</label>
                  <Input
                    {...register('current_meds_text')}
                    className="mt-1 text-xs"
                    placeholder="e.g. Metformin 500mg, Atorvastatin 10mg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Documented Drug Allergies</label>
                  <Input
                    {...register('allergies_text')}
                    className="mt-1 text-xs"
                    placeholder="e.g. Penicillin, Sulfa"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="default"
                  disabled={isAnalyzing || !file}
                  className="w-full sm:w-auto font-semibold flex items-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Executing Clinical Analysis Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4" />
                      <span>Run Full CDSS Safety Evaluation</span>
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
          {/* Clinical Alert Top Banner if Critical */}
          {analysisResult.clinical_risk.risk_classification === 'CRITICAL' && (
            <Alert variant="critical">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-sm font-bold text-red-900 dark:text-red-200">
                Critical Safety Alert: High-Risk Prescription Detected
              </AlertTitle>
              <AlertDescription className="text-xs text-red-800 dark:text-red-300 mt-1">
                Ketorolac (Rolac 10) 14-day duration exceeds safety ceilings and is contraindicated in patient's CKD Stage 3 (eGFR 34.5). Concomitant Olmesartan increases Acute Kidney Injury hazard. Immediate clinician substitution required.
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
                Evaluated: {new Date(analysisResult.timestamp).toLocaleTimeString()} • Engine: {analysisResult.meta.ocr_engine}
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
                Print CDSS Card
              </Button>
              <Button
                size="sm"
                onClick={() => setIsReviewModalOpen(true)}
                className="text-xs bg-primary text-primary-foreground font-semibold"
              >
                <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
                Clinician Sign-Off & Audit
              </Button>
            </div>
          </div>

          {/* Tabbed Results Layout */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full sm:w-[540px]">
              <TabsTrigger value="clinical">Clinical Findings</TabsTrigger>
              <TabsTrigger value="interactions">Interactions ({analysisResult.drug_interactions.length})</TabsTrigger>
              <TabsTrigger value="risk">SHAP Explainability</TabsTrigger>
              <TabsTrigger value="bangla">Bangla Companion</TabsTrigger>
            </TabsList>

            {/* TAB 1: Clinical Findings & Normalization */}
            <TabsContent value="clinical" className="space-y-6 mt-4">
              {/* Extracted Medicines Table */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">
                        Prescription Medicines & Deterministic Syntax Checks
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Bangladesh brand name normalization, dosage syntax, and rule-based safety ceiling checks.
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
                          <th className="py-2.5 px-4 font-semibold">Brand (Written)</th>
                          <th className="py-2.5 px-4 font-semibold">Generic Normalized</th>
                          <th className="py-2.5 px-4 font-semibold">Dosage & Syntax</th>
                          <th className="py-2.5 px-4 font-semibold">Duration</th>
                          <th className="py-2.5 px-4 font-semibold">Safety Status</th>
                          <th className="py-2.5 px-4 font-semibold">Issues Flagged</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {analysisResult.extracted_prescription.map((med, idx) => (
                          <tr key={idx} className={med.issues.some((i) => i.severity === 'CRITICAL') ? 'bg-red-50/30 dark:bg-red-950/20' : ''}>
                            <td className="py-3 px-4 font-semibold text-foreground">
                              {med.brand_name}
                              <span className="block text-[10px] text-muted-foreground">
                                Form: {med.form || 'Tab'} • Strength: {med.strength || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-teal-800 dark:text-teal-300">
                              {med.generic_name || 'Unmapped Brand'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-semibold">{med.dosage_syntax || 'N/A'}</span>
                              <span className="block text-[10px] text-muted-foreground">{med.timing}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={med.duration_days && med.duration_days > 5 && med.brand_name.toLowerCase().includes('rolac') ? 'font-bold text-red-600' : ''}>
                                {med.duration_days ? `${med.duration_days} days` : 'Continue'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {med.syntax_valid ? (
                                <Badge variant="success" className="text-[10px]">
                                  Valid Syntax
                                </Badge>
                              ) : (
                                <Badge variant="critical" className="text-[10px]">
                                  Ceiling Exceeded
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 space-y-1">
                              {med.issues.length === 0 ? (
                                <span className="text-muted-foreground">None</span>
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
                                    <strong className="block font-semibold">{issue.code}:</strong>
                                    <span>{issue.message}</span>
                                  </div>
                                ))
                              )}
                            </td>
                          </tr>
                        ))}
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
                      <span>Safer Therapeutic Alternatives for Clinician Consideration</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Evidence-backed medication substitutions to resolve identified contraindications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysisResult.safer_alternatives.map((alt, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-card"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-xs text-red-600 line-through mr-2 font-medium">
                              Replace: {alt.original_brand}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              → Recommended: {alt.alternative_brand} ({alt.alternative_generic})
                            </span>
                          </div>
                          <Badge variant="success" className="text-[10px]">
                            Renal-sparing
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          <strong>Rationale: </strong>{alt.clinical_rationale}
                        </p>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                          <strong>Safety Benefit: </strong>{alt.safety_benefit}
                        </p>
                      </div>
                    ))}
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
                    <span>Detected Drug Interactions & Pharmacovigilance Advisories</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Interplay between prescribed agents and patient's baseline medications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisResult.drug_interactions.map((interaction) => (
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
                          {interaction.severity} SEVERITY
                        </Badge>
                      </div>

                      <div className="text-xs space-y-1.5">
                        <p className="text-muted-foreground">
                          <strong className="text-foreground">Mechanism: </strong>
                          {interaction.mechanism}
                        </p>
                        <p className="text-muted-foreground">
                          <strong className="text-foreground">Clinical Consequence: </strong>
                          {interaction.clinical_significance}
                        </p>
                        <p className="text-amber-800 dark:text-amber-300">
                          <strong>Recommended Action: </strong>
                          {interaction.recommended_action}
                        </p>
                        <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                          <strong>Evidence Source: </strong>
                          {interaction.evidence_source}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Explainable Risk & SHAP */}
            <TabsContent value="risk" className="space-y-6 mt-4">
              <RiskGaugeCard risk={analysisResult.clinical_risk} />
              <ShapWaterfallChart
                features={analysisResult.clinical_risk.shap_features}
                isDemo={analysisResult.clinical_risk.is_synthetic_demo}
              />
            </TabsContent>

            {/* TAB 4: Bangla Patient Companion */}
            <TabsContent value="bangla" className="mt-4">
              <BanglaPatientCompanion
                data={analysisResult.bangla_companion}
                patientName={analysisResult.patient_context.name}
              />
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
