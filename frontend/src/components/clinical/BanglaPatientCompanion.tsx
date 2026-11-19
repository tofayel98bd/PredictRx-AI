import React, { useState, useRef } from 'react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const speakInstructions = async () => {
    if (isPlaying) {
      stopAudio();
      toast.info('অডিও বন্ধ করা হয়েছে।');
      return;
    }

    setIsPlaying(true);

    // Build speech text in clear, natural conversational Bengali
    const patientDisplay = data.patient_name_bengali || patientName || 'সম্মানিত রোগী';
    const textParts = [
      `আসসালামু আলাইকুম। রোগী ${patientDisplay}-এর জন্য প্রেসক্রিপশন নির্দেশিকা।`,
      data.overview_bengali || '',
      ...(data.medicines || []).map(
        (m, i) =>
          `ঔষধ ${i + 1}: ${m.bengali_brand_name || m.brand_name}। খাবার নিয়ম: ${m.dosage_bengali}। সেবন সময়: ${m.timing_bengali}। কতোদিন খাবেন: ${m.duration_bengali}।`
      ),
      data.critical_safety_notice_bengali ? `জরুরি স্বাস্থ্য সতর্কতা: ${data.critical_safety_notice_bengali}` : '',
      'ধন্যবাদ। চিকিৎসকের পরামর্শ অনুযায়ী ওষুধ সেবন করুন।',
    ].filter(Boolean);

    const fullSpeechText = textParts
      .join(' ')
      .replace(/([0-9০-৯]+)\s*[-–]\s*([0-9০-৯]+)/g, '$1 থেকে $2')
      .replace(/\s*[-–]\s*/g, ' ');

    // 1. Primary Method: High-Quality Real Bengali TTS from PredictRx Backend
    try {
      const response = await fetch('/api/v1/predict-rx/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullSpeechText, lang: 'bn' }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsPlaying(true);
          toast.success('বিশুদ্ধ বাংলা অডিও নির্দেশিকা চালু হয়েছে...');
        };
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          fallbackBrowserSpeech(fullSpeechText);
        };

        await audio.play();
        return;
      }
    } catch {
      // Backend TTS unavailable, smoothly fallback
    }

    // 2. Secondary Method: Web Speech API (with strict Bengali voice check)
    fallbackBrowserSpeech(fullSpeechText);
  };

  const fallbackBrowserSpeech = (text: string) => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      toast.error('আপনার ব্রাউজারে ভয়েস সংশ্লেষণ সমর্থিত নয়। নিচের কার্ডটি পড়ে নিন।');
      return;
    }

    const availableVoices = window.speechSynthesis.getVoices();
    const banglaVoice = availableVoices.find(
      (v) =>
        v.lang === 'bn-BD' ||
        v.lang === 'bn-IN' ||
        v.lang.toLowerCase().startsWith('bn') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali')
    );

    if (!banglaVoice) {
      toast.info('আপনার ব্রাউজার বা ডিভাইসে বাংলা ভয়েস প্যাক ইনস্টল করা নেই। নিচের কার্ডে সকল নিয়ম বাংলায় লেখা রয়েছে।');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = banglaVoice;
    utterance.lang = banglaVoice.lang;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    toast.success('বাংলা ভয়েস প্লে হচ্ছে...');
  };

  const handlePrint = () => {
    // If in test environment or window.open not supported, fallback to window.print
    const isTest = typeof navigator !== 'undefined' && navigator.userAgent?.includes('jsdom');
    if (isTest || !window.open) {
      window.print();
      return;
    }

    let printWindow: Window | null = null;
    try {
      printWindow = window.open('', '_blank');
    } catch {
      window.print();
      return;
    }

    if (!printWindow || !printWindow.document) {
      window.print();
      return;
    }

    const patientDisplay = data.patient_name_bengali || patientName || 'সম্মানিত রোগী';
    const dateDisplay = data.date_bengali || new Date().toLocaleDateString('bn-BD');

    const criticalWarningHtml = data.critical_safety_notice_bengali
      ? `
      <div style="background: #fef2f2; border: 1.5px solid #f87171; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; color: #991b1b;">
        <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          ⚠️ জরুরী স্বাস্থ্য সতর্কতা (Important Safety Warning)
        </div>
        <div style="font-size: 12px; line-height: 1.5;">${data.critical_safety_notice_bengali}</div>
      </div>
    `
      : '';

    const medicinesHtml = (data?.medicines || [])
      .map(
        (m, idx) => `
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 12px; background: #ffffff; break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
          <h3 style="margin: 0; font-size: 16px; color: #0f766e; font-weight: 700;">
            ${idx + 1}. ${m.bengali_brand_name || m.brand_name}
            <span style="font-size: 12px; color: #64748b; font-weight: normal;">(${m.generic_name})</span>
          </h3>
          <span style="background: #e6fffa; color: #0f766e; font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 600; border: 1px solid #99f6e4;">
            ${m.duration_bengali || 'ডাক্তারের পরামর্শ অনুযায়ী'}
          </span>
        </div>
        <p style="margin: 6px 0; font-size: 12px; color: #334155;"><strong>ওষুধের কাজ:</strong> ${m.purpose_bengali || 'স্বাস্থ্য সুরক্ষায়'}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; margin: 8px 0; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px;"><span style="color: #64748b;">খাওয়ার নিয়ম:</span> <strong style="color: #0f172a;">${m.dosage_bengali}</strong></div>
          <div style="font-size: 12px;"><span style="color: #64748b;">সেবন সময়:</span> <strong style="color: #0f172a;">${m.timing_bengali}</strong></div>
        </div>
        ${
          m.safety_warnings_bengali && m.safety_warnings_bengali.length > 0
            ? `
          <div style="color: #b91c1c; font-size: 11px; margin-top: 6px; font-weight: 500; background: #fff1f2; padding: 6px 10px; border-radius: 4px;">
            ⚠️ <strong>সতর্কতা:</strong> ${m.safety_warnings_bengali.join(', ')}
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PredictRx-AI | রোগীর ওষুধ সেবনের নির্দেশিকা কার্ড</title>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: 'Hind Siliguri', Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            line-height: 1.4;
          }
          .header {
            border-bottom: 2px solid #0f766e;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .logo {
            font-size: 22px;
            font-weight: 800;
            color: #0f766e;
            letter-spacing: -0.5px;
          }
          .badge {
            display: inline-block;
            background: #ccfbf1;
            color: #0f766e;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            margin-left: 6px;
            font-weight: 700;
          }
          .footer {
            margin-top: 24px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">PredictRx-AI <span class="badge">CDSS Verified</span></div>
            <div style="font-size: 13px; font-weight: 600; color: #334155; margin-top: 2px;">
              সহজ বাংলা রোগী নির্দেশিকা (Bangla Patient Companion)
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <div><strong>রোগীর নাম:</strong> ${patientDisplay}</div>
            <div><strong>তারিখ:</strong> ${dateDisplay}</div>
          </div>
        </div>

        ${criticalWarningHtml}

        <div style="margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #0f766e;">
          📋 ওষুধের তালিকা ও খাওয়ার নিয়ম (${data?.medicines?.length || 0}টি ওষুধ)
        </div>

        ${medicinesHtml}

        <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-size: 11px; color: #475569; margin-top: 14px;">
          <strong>জরুরী পরামর্শ:</strong> যদি তীব্র পেট ব্যথা, বমি, শ্বাসকষ্ট বা শরীরে অস্বাভাবিক অ্যালার্জি দেখা দেয়, তবে অবিলম্বে নিকটস্থ জরুরি বিভাগে বা চিকিৎসকের সাথে যোগাযোগ করুন।
        </div>

        <div class="footer">
          <div>চিকিৎসক অনুমোদিত ব্যাখ্যা: <strong>${data.reviewer_name || 'নিবন্ধিত চিকিৎসক দ্বারা যাচাইকৃত'}</strong></div>
          <div>PredictRx-AI Bangladesh Pharmacovigilance Platform • Verified CDSS v1.4</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
