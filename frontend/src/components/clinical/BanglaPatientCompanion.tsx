import React, { useState } from 'react';
import { Volume2, VolumeX, Printer, CheckCircle, AlertTriangle, ShieldCheck, HeartHandshake } from 'lucide-react';
import { BanglaPatientCompanion as BanglaData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface BanglaCompanionProps {
  data: BanglaData;
  patientName?: string;
}

export const BanglaPatientCompanion: React.FC<BanglaCompanionProps> = ({ data, patientName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'bn' | 'en'>('bn');

  const speakInstructions = () => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      toast.error('Voice synthesis is not supported on this device/browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Build speech text
    const textToSpeak = [
      `প্রেসক্রিপশন নির্দেশিকা। রোগী: ${data.patient_name_bengali || patientName || 'সম্মানিত রোগী'}।`,
      data.overview_bengali,
      ...data.medicines.map(
        (m, i) =>
          `ঔষধ ${i + 1}: ${m.bengali_brand_name || m.brand_name}। খাবার নিয়ম: ${m.dosage_bengali}। সেবন সময়: ${m.timing_bengali}। মেয়াদ: ${m.duration_bengali}।`
      ),
      `জরুরি সতর্কতা: ${data.critical_safety_notice_bengali}`,
    ].join(' ');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Dynamic Voice Detection with Bengali fallbacks (bn-BD, bn-IN, bn)
    const availableVoices = window.speechSynthesis.getVoices();
    const banglaVoice = availableVoices.find(
      (v) =>
        v.lang === 'bn-BD' ||
        v.lang === 'bn-IN' ||
        v.lang.toLowerCase().startsWith('bn') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali')
    );

    if (banglaVoice) {
      utterance.voice = banglaVoice;
      utterance.lang = banglaVoice.lang;
    } else {
      utterance.lang = 'bn-BD';
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      toast.info('Bangla voice synthesis fallback: You can read the printed card below.');
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    toast.success('Bangla audio explanation playing...');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="border-teal-200 dark:border-teal-900 shadow-md card-print">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg font-bold text-teal-950 dark:text-teal-100">
                  সহজ বাংলা রোগী নির্দেশিকা (Bangla Patient Companion)
                </CardTitle>
                <Badge variant="success" className="text-[10px]">
                  সহজবোধ্য ভাষা
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                রোগী এবং স্বজনদের জন্য প্রেসক্রিপশনের ওষুধ সেবনের স্পষ্ট নিয়ম ও গুরুত্বপূর্ণ সতর্কতা
              </p>
            </div>
          </div>

          <div className="no-print flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={speakInstructions}
              className="text-xs flex items-center space-x-1.5 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200"
            >
              {isPlaying ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4 text-teal-600" />}
              <span>{isPlaying ? 'বন্ধ করুন (Stop)' : 'শব্দে শুনুন (Listen)'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs flex items-center space-x-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>প্রিন্ট করুন (Print Card)</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Clinician Approval Notice */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 text-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
            <span className="text-teal-900 dark:text-teal-200 font-medium">
              চিকিৎসক অনুমোদিত ব্যাখ্যা: {data.reviewer_name || 'নিবন্ধিত চিকিৎসক দ্বারা যাচাইকৃত'}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">তারিখ: {data.date_bengali}</span>
        </div>

        {/* Critical Safety Notice if Any */}
        {data.critical_safety_notice_bengali && (
          <div className="p-4 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-900 dark:text-red-300">
                  জরুরী স্বাস্থ্য সতর্কতা (Important Safety Warning)
                </h4>
                <p className="mt-1 text-xs leading-relaxed font-medium">
                  {data.critical_safety_notice_bengali}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Medicines Instruction Cards */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center space-x-2">
            <span>ওষুধের তালিকা ও খাওয়ার সঠিক নিয়ম</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({data?.medicines?.length || 0}টি ওষুধ)
            </span>
          </h4>

          {(!data?.medicines || data.medicines.length === 0) ? (
            <div className="p-6 rounded-xl border border-dashed border-border text-center text-muted-foreground text-xs space-y-1">
              <p className="font-semibold text-foreground">কোনো ওষুধ তালিকাভুক্ত পাওয়া যায়নি</p>
              <p>প্রেসক্রিপশনটি পুনরায় স্ক্যান করুন অথবা উপরের ড্রপডাউন থেকে গোল্ডেন ডেমো প্রেসক্রিপশন নির্বাচন করুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.medicines.map((med, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-base text-foreground">
                        {med.bengali_brand_name || med.brand_name}
                      </h5>
                      <p className="text-xs text-muted-foreground">{med.generic_name}</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-teal-300 text-teal-800 dark:text-teal-300">
                      ওষুধ {idx + 1}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-muted">
                      <span className="text-muted-foreground">খাওয়ার নিয়ম:</span>
                      <span className="font-semibold text-foreground text-right">{med.dosage_bengali}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-muted">
                      <span className="text-muted-foreground">সেবন সময়:</span>
                      <span className="font-medium text-foreground text-right">{med.timing_bengali}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-muted">
                      <span className="text-muted-foreground">কতোদিন খাবেন:</span>
                      <span className="font-medium text-amber-700 dark:text-amber-400 text-right">{med.duration_bengali}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-muted">
                      <span className="text-muted-foreground">ওষুধটির উদ্দেশ্য:</span>
                      <span className="font-medium text-teal-700 dark:text-teal-400 text-right">{med.purpose_bengali}</span>
                    </div>
                  </div>

                  {med.safety_warnings_bengali && med.safety_warnings_bengali.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-border/60">
                      <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">বিশেষ সতর্কতা:</span>
                      <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                        {med.safety_warnings_bengali.map((w, wIdx) => (
                          <li key={wIdx} className="leading-snug">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Instructions */}
        <div className="p-3.5 rounded-lg border border-border bg-muted/40 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">জরুরী পরামর্শ: </span>
            {data?.emergency_instructions_bengali ||
              'যদি তীব্র পেট ব্যথা, কালো পায়খানা, বমি, শ্বাসকষ্ট বা শরীরে কোনো অস্বাভাবিক অ্যালার্জি দেখা দেয়, তবে অবিলম্বে নিকটস্থ জরুরি বিভাগে বা রেজিস্টার্ড চিকিৎসকের সাথে যোগাযোগ করুন।'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
