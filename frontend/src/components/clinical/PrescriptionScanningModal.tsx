import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Circle,
  FileText,
  ShieldCheck,
  Cpu,
  Eye,
  Check,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface PrescriptionScanningModalProps {
  isOpen: boolean;
  onClose?: () => void;
  filePreview: string | null;
  fileName?: string;
  isAnalyzing?: boolean;
}

const SCAN_STEPS_EN = [
  { id: 1, label: 'Optical CLAHE Contrast Enhancement & Denoising', icon: Eye },
  { id: 2, label: 'Google Gemini Multimodal Vision Neural Perception', icon: Cpu },
  { id: 3, label: 'Handwritten Bengali & Latin Rx Syntax Parsing (1+0+1)', icon: FileText },
  { id: 4, label: 'Cross-referencing Bangladesh DGDA Formulary & Brands', icon: Sparkles },
  { id: 5, label: 'Clinical Pharmacology & Pharmacovigilance Risk Check', icon: ShieldCheck },
];

const SCAN_STEPS_BN = [
  { id: 1, label: 'প্রেসক্রিপশন ইমেজের কনট্রাস্ট ও স্বচ্ছতা উন্নয়ন (CLAHE)', icon: Eye },
  { id: 2, label: 'গুগল জেমিনি মাল্টিমডাল ভিশন নিউরাল স্ক্যানিং', icon: Cpu },
  { id: 3, label: 'হাতে লেখা বাংলা ও ইংরেজি ওষুধের ডোজ প্যাটার্ন বিশ্লেষণ (১+০+১)', icon: FileText },
  { id: 4, label: 'বাংলাদেশ DGDA ড্রাগ ডেটাবেজ ও জেনেরিক ম্যাপিং', icon: Sparkles },
  { id: 5, label: 'ক্লিনিক্যাল ফার্মাকোলজি ও ড্রাগ সেফটি ঝুঁকি মূল্যায়ন', icon: ShieldCheck },
];

export const PrescriptionScanningModal: React.FC<PrescriptionScanningModalProps> = ({
  isOpen,
  onClose,
  filePreview,
  fileName,
  isAnalyzing = false,
}) => {
  const { i18n } = useTranslation();
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));
  const steps = isBn ? SCAN_STEPS_BN : SCAN_STEPS_EN;

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(15);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(15);
      setElapsedSeconds(0);
      return;
    }

    // Timer for elapsed seconds
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    // Progressive step advancement while modal is open
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2200);

    // Smooth progress bar advancement
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 92) {
          return prev + Math.floor(Math.random() * 4) + 2;
        }
        return prev;
      });
    }, 450);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen, steps.length]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && onClose) onClose(); }}>
      <DialogContent className="max-w-lg w-full p-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-teal-500/40 shadow-2xl rounded-2xl sm:rounded-2xl gap-0">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                {isBn ? 'লাইভ এআই ভিশন স্ক্যানিং' : 'LIVE AI CLINICAL PERCEPTION'}
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-teal-500/30 text-teal-700 dark:text-teal-300 bg-teal-500/10">
              CDSS Engine v1.4
            </Badge>
          </div>

          <h3 className="text-base font-bold text-foreground">
            {isBn
              ? 'প্রেসক্রিপশন এআই বিশ্লেষণ ও তথ্য প্রক্রিয়াকরণ'
              : 'Prescription Visual OCR & Clinical Synthesis'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isBn
              ? 'হাতে লেখা ও মুদ্রিত প্রেসক্রিপশন থেকে নির্ভুল ওষুধ ও রোগীর তথ্য এক্সট্রাক্ট করা হচ্ছে...'
              : 'Extracting medications, dosing regimens & patient parameters via multimodal vision...'}
          </p>
        </div>

        {/* Viewport with Futuristic Laser Scanner */}
        <div className="relative bg-slate-950 p-4 flex items-center justify-center min-h-[210px] max-h-[240px] overflow-hidden select-none border-y border-teal-900/40">
          {/* Cyber Medical Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:16px_16px] animate-grid-pulse pointer-events-none" />

          {/* Prescription Image or High-tech Placeholder */}
          {filePreview ? (
            <img
              src={filePreview}
              alt="Prescription Scan Viewport"
              className="max-h-[190px] w-auto max-w-full object-contain rounded shadow-2xl border border-teal-500/30 opacity-90 transition-all duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-teal-400">
              <FileText className="h-16 w-16 mb-2 opacity-70 animate-pulse" />
              <span className="text-xs font-mono tracking-widest text-teal-300">
                {fileName || 'PRESCRIPTION_DOCUMENT.PDF'}
              </span>
            </div>
          )}

          {/* Sweeping Laser Beam Line */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 shadow-[0_0_15px_#22d3ee,0_0_30px_#14b8a6] animate-laser-sweep pointer-events-none">
            {/* Ambient downward light glow */}
            <div className="absolute -inset-x-0 top-0 h-8 bg-gradient-to-b from-cyan-400/25 to-transparent pointer-events-none" />
          </div>

          {/* Viewfinder Target Brackets */}
          <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

          {/* Viewfinder HUD Micro-text */}
          <div className="absolute top-3 left-8 text-[9px] font-mono text-cyan-400/90 tracking-widest flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span>OPTICAL MATRIX // ACTIVE</span>
          </div>

          <div className="absolute top-3 right-8 text-[9px] font-mono text-teal-400/90 tracking-widest">
            GEMINI-3.8-VISION
          </div>

          <div className="absolute bottom-3 left-8 text-[9px] font-mono text-slate-400/80 tracking-wider truncate max-w-[200px]">
            {fileName || 'Prescription Image'}
          </div>

          <div className="absolute bottom-3 right-8 text-[9px] font-mono text-emerald-400 tracking-wider">
            PERCEPTION: 96%
          </div>
        </div>

        {/* Live Stepper & Progress Section */}
        <div className="p-4 sm:p-5 space-y-4 bg-card">
          {/* Progress bar with percentage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center space-x-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-teal-600 animate-spin" />
                <span>
                  {isBn
                    ? `ধাপ ${currentStep + 1} / ${steps.length}: ${steps[currentStep].label}`
                    : `Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep].label}`}
                </span>
              </span>
              <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-muted overflow-hidden" />
          </div>

          {/* Mini Step List */}
          <div className="space-y-2 pt-1">
            {steps.map((st, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              const StepIcon = st.icon;

              return (
                <div
                  key={st.id}
                  className={`flex items-center space-x-2.5 text-xs transition-colors duration-200 ${
                    isCurrent
                      ? 'text-teal-700 dark:text-teal-300 font-semibold'
                      : isPast
                      ? 'text-foreground/80'
                      : 'text-muted-foreground/50'
                  }`}
                >
                  <div className="shrink-0">
                    {isPast ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : isCurrent ? (
                      <RefreshCw className="h-3.5 w-3.5 text-teal-500 animate-spin" />
                    ) : (
                      <Circle className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                  <StepIcon className={`h-3.5 w-3.5 shrink-0 ${isCurrent ? 'text-teal-500' : 'opacity-60'}`} />
                  <span className="truncate">{st.label}</span>
                </div>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono text-[11px] flex items-center space-x-1">
              <span>⏱️</span>
              <span>
                {isBn ? 'অতিক্রান্ত সময়:' : 'Elapsed:'} {elapsedSeconds}s
              </span>
            </span>

            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                {isBn ? 'ব্যাকগ্রাউন্ডে চালান' : 'Continue in background'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
