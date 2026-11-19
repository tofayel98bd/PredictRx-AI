import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Printer, AlertTriangle, ShieldCheck, HeartHandshake } from 'lucide-react';
import { BanglaPatientCompanion as BanglaData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface BanglaCompanionProps {
  data: BanglaData;
  patientName?: string;
  lang?: 'en' | 'bn';
}

const DOSAGE_EN_MAP: Record<string, string> = {
  'সকালে ১টি ও রাতে ১টি': '1 in morning & 1 at night',
  'সকালে ১টি, দুপুরে ১টি ও রাতে ১টি': '1 in morning, 1 at noon & 1 at night',
  'সকালে ১টি': '1 in morning',
  'রাতে ১টি': '1 at night',
  'দুপুরে ১টি': '1 at noon',
  'প্রতি ৬ ঘণ্টা পর পর ১টি (দিনে ৪ বার)': 'Every 6 hours (4 times daily)',
  'সকালে অর্ধেক ও রাতে অর্ধেক': 'Half in morning & half at night',
  'দিনে ৩ বার ১ চামচ করে': '1 spoonful 3 times daily',
  'দিনে ৩ বার ২ চামচ করে': '2 spoonfuls 3 times daily',
  'প্রতিদিন ১ বার': 'Once daily',
  'প্রতিদিন ২ বার': 'Twice daily',
  'প্রতিদিন ৩ বার': 'Three times daily',
  'রাতে শোবার আগে': 'At bedtime',
  'প্রয়োজন হলে': 'As needed (PRN)',
  'জরুরি প্রয়োজনে': 'Emergency (SOS)',
  'জরুরি প্রয়োজনে তাৎক্ষণিক এক মাত্রা': 'Stat single dose',
};

const TIMING_EN_MAP: Record<string, string> = {
  'খাবার পরে ভরা পেটে খাবেন': 'Take after meals on a full stomach',
  'খাবারের ২০ থেকে ৩০ মিনিট আগে খাবেন': 'Take 20 to 30 minutes before meals',
  'খাবারের আগে': 'Take before meals',
  'খাবারের পর': 'Take after meals',
};

const PURPOSE_EN_MAP: Record<string, string> = {
  'উচ্চ রক্তচাপ ও কিডনির রক্তনালী সুরক্ষায়': 'For blood pressure management & renal protection',
  'উচ্চ রক্তচাপ নিয়ন্ত্রণে রাখতে': 'For blood pressure management',
  'স্বাস্থ্য সুরক্ষার জন্য': 'For blood sugar & therapeutic maintenance',
  'শরীরে রক্তের সুগার ও তাৎক্ষণিক শক্তি যোগাতে': 'To restore blood sugar & provide immediate energy',
  'শরীরে পানিশূন্যতা ও ইলেক্ট্রোলাইটের ভারসাম্য বজায় রাখতে': 'To maintain hydration & electrolyte balance',
  'জ্বর ও হালকা ব্যথা নিরাময়ে': 'For fever & mild pain relief',
  'গ্যাস্ট্রিক ও অ্যাসিডিটি নিয়ন্ত্রণে': 'For gastric acid & heartburn control',
  'পেটের গ্যাস ও আলসারের সুরক্ষায়': 'For gastric ulcer protection & acidity',
  'রক্ত তরল রাখতে ও হৃদরোগ প্রতিরোধে': 'Blood thinner for cardiovascular protection',
  'তীব্র স্বল্পমেয়াদী ব্যথা কমানোর জন্য': 'For short-term acute pain management',
  'অ্যালার্জি, হাঁচি ও সর্দি প্রতিরোধে': 'For allergy, sneezing & rhinitis relief',
  'শ্বাসকষ্ট ও অ্যালার্জিক হাঁপানি নিয়ন্ত্রণে': 'For asthma & allergy symptom control',
  'ব্যাকটেরিয়াজনিত জীবাণু সংক্রমণের চিকিৎসায়': 'For bacterial infection treatment',
  'মূত্রনালী বা পেটের সংক্রমণের চিকিৎসায়': 'For urinary tract or GI infection treatment',
  'আমাশয় ও পেটের জীবাণু ধ্বংস করতে': 'For amoebic infection treatment',
  'শরীরের অতিরিক্ত পানি ও ফোলা ভাব কমাতে': 'Diuretic to reduce fluid overload & swelling',
};

const DURATION_EN_MAP: Record<string, string> = {
  'ডাক্তারের পরবর্তী পরামর্শ পর্যন্ত': 'Until next clinician follow-up',
  'ডাক্তারের পরামর্শ অনুযায়ী': 'As directed by physician',
  '৭ দিন পর্যন্ত': 'For 7 days',
  '১৪ দিন পর্যন্ত': 'For 14 days',
  '৫ দিন পর্যন্ত': 'For 5 days',
  '১০ দিন পর্যন্ত': 'For 10 days',
  '৩০ দিন পর্যন্ত': 'For 30 days',
};

export const BanglaPatientCompanion: React.FC<BanglaCompanionProps> = ({
  data,
  patientName,
  lang,
}) => {
  const { i18n } = useTranslation(['analysis', 'common']);
  const activeLang = lang || (i18n.language && i18n.language.startsWith('bn') ? 'bn' : 'en');
  const isBn = activeLang === 'bn';

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getDosageDisplay = (dosageBn: string) => {
    if (isBn) return dosageBn;
    return DOSAGE_EN_MAP[dosageBn] || dosageBn;
  };

  const getTimingDisplay = (timingBn: string) => {
    if (isBn) return timingBn;
    if (TIMING_EN_MAP[timingBn]) return TIMING_EN_MAP[timingBn];
    if (timingBn.includes('আগে')) return 'Take 20 to 30 minutes before meals';
    if (timingBn.includes('পরে')) return 'Take after meals on a full stomach';
    return 'Take as directed by physician';
  };

  const getDurationDisplay = (durationBn: string) => {
    if (isBn) return durationBn;
    if (DURATION_EN_MAP[durationBn]) return DURATION_EN_MAP[durationBn];
    const numMatch = durationBn.match(/[0-9০-৯]+/);
    if (numMatch) {
      const digits = numMatch[0].replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
      return `For ${digits} days`;
    }
    if (durationBn.includes('পরামর্শ')) return 'Until next clinician follow-up';
    return 'As directed by physician';
  };

  const getPurposeDisplay = (purposeBn: string, genName?: string) => {
    if (isBn) return purposeBn;
    if (PURPOSE_EN_MAP[purposeBn]) return PURPOSE_EN_MAP[purposeBn];
    const gen = (genName || '').toLowerCase();
    if (gen.includes('ramipril')) return 'For blood pressure management & renal protection';
    if (gen.includes('metformin')) return 'To control blood glucose levels (Diabetes)';
    if (gen.includes('ketorolac')) return 'For short-term acute pain management';
    if (gen.includes('olmesartan') || gen.includes('amlodipine')) return 'For blood pressure management';
    if (gen.includes('paracetamol')) return 'For fever & pain relief';
    if (gen.includes('aspirin')) return 'Blood thinner for cardiovascular prophylaxis';
    if (gen.includes('furosemide')) return 'Diuretic to reduce fluid overload & swelling';
    return 'For therapeutic health maintenance';
  };

  const getSafetyNoticeDisplay = (noticeBn?: string) => {
    if (!noticeBn) return '';
    if (isBn) return noticeBn;
    return 'Important Safety Warning: Take all medications strictly as prescribed for the specified duration and correct timings. Do not self-modify doses.';
  };

  const getEmergencyInstructionsDisplay = (emerBn?: string) => {
    if (isBn) {
      return (
        emerBn ||
        'যদি তীব্র পেট ব্যথা, কালো পায়খানা, বমি, শ্বাসকষ্ট বা শরীরে কোনো অস্বাভাবিক অ্যালার্জি দেখা দেয়, তবে অবিলম্বে নিকটস্থ জরুরি বিভাগে বা রেজিস্টার্ড চিকিৎসকের সাথে যোগাযোগ করুন।'
      );
    }
    return 'If severe abdominal pain, dark tarry stools, persistent vomiting, shortness of breath, or sudden allergic reactions occur, immediately seek emergency medical care or contact a registered physician.';
  };

  const getSpecialWarningsDisplay = (warningsBn: string[], genName?: string) => {
    if (isBn) return warningsBn;
    const gen = (genName || '').toLowerCase();
    if (gen.includes('ketorolac')) {
      return ['Do not use for more than 5 days. Report any abdominal pain or dark stools to your physician immediately.'];
    }
    if (gen.includes('paracetamol')) {
      return ['Do not exceed recommended dose. Do not take concomitantly with other paracetamol products.'];
    }
    if (gen.includes('metronidazole')) {
      return ['Avoid all alcohol consumption while taking this medication.'];
    }
    return [];
  };

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
      toast.info(isBn ? 'অডিও বন্ধ করা হয়েছে।' : 'Audio stopped.');
      return;
    }

    setIsPlaying(true);

    let fullSpeechText = '';

    if (isBn) {
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

      fullSpeechText = textParts
        .join(' ')
        .replace(/([0-9০-৯]+)\s*[-–]\s*([0-9০-৯]+)/g, '$1 থেকে $2')
        .replace(/\s*[-–]\s*/g, ' ');
    } else {
      const patientDisplay = patientName || 'valued patient';
      const textParts = [
        `Hello. Here is the medication schedule for patient ${patientDisplay}.`,
        ...(data.medicines || []).map(
          (m, i) =>
            `Medication ${i + 1}: ${m.brand_name}. Dosage: ${getDosageDisplay(m.dosage_bengali)}. Timing: ${getTimingDisplay(m.timing_bengali)}. Duration: ${getDurationDisplay(m.duration_bengali)}.`
        ),
        getSafetyNoticeDisplay(data.critical_safety_notice_bengali),
        "Thank you. Please take medications strictly according to your physician's instructions.",
      ].filter(Boolean);

      fullSpeechText = textParts
        .join(' ')
        .replace(/([0-9]+)\s*[-–]\s*([0-9]+)/g, '$1 to $2')
        .replace(/\s*[-–]\s*/g, ' ');
    }

    // 1. Primary Method: High-Quality Real Audio TTS from PredictRx Backend
    try {
      const response = await fetch('/api/v1/predict-rx/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullSpeechText, lang: isBn ? 'bn' : 'en' }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsPlaying(true);
          toast.success(isBn ? 'বিশুদ্ধ বাংলা অডিও নির্দেশিকা চালু হয়েছে...' : 'Audio voice guide is playing...');
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

    // 2. Secondary Method: Web Speech API
    fallbackBrowserSpeech(fullSpeechText);
  };

  const fallbackBrowserSpeech = (text: string) => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      toast.error(isBn ? 'আপনার ব্রাউজারে ভয়েস সমর্থিত নয়।' : 'Voice synthesis not supported in browser.');
      return;
    }

    const availableVoices = window.speechSynthesis.getVoices();
    let targetVoice: SpeechSynthesisVoice | undefined;

    if (isBn) {
      targetVoice = availableVoices.find(
        (v) =>
          v.lang === 'bn-BD' ||
          v.lang === 'bn-IN' ||
          v.lang.toLowerCase().startsWith('bn') ||
          v.name.toLowerCase().includes('bangla') ||
          v.name.toLowerCase().includes('bengali')
      );
    } else {
      targetVoice = availableVoices.find(
        (v) =>
          v.lang.startsWith('en') ||
          v.name.toLowerCase().includes('english')
      );
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (targetVoice) {
      utterance.voice = targetVoice;
      utterance.lang = targetVoice.lang;
    } else {
      utterance.lang = isBn ? 'bn-BD' : 'en-US';
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    toast.success(isBn ? 'ভয়েস প্লে হচ্ছে...' : 'Voice playing...');
  };

  const handlePrint = () => {
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

    const patientDisplay = isBn
      ? (data.patient_name_bengali || patientName || 'সম্মানিত রোগী')
      : (patientName || 'Valued Patient');
    const dateDisplay = isBn
      ? (data.date_bengali || new Date().toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0];

    const criticalWarningHtml = data.critical_safety_notice_bengali
      ? `
        <div style="background: #fef2f2; border: 1px solid #f87171; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <div style="color: #991b1b; font-weight: 700; font-size: 13px;">
            ⚠️ ${isBn ? 'জরুরী স্বাস্থ্য সতর্কতা (Important Safety Warning)' : 'Important Safety Warning'}
          </div>
          <div style="color: #7f1d1d; font-size: 11px; margin-top: 4px; line-height: 1.4;">
            ${getSafetyNoticeDisplay(data.critical_safety_notice_bengali)}
          </div>
        </div>
      `
      : '';

    const medicinesHtml = (data?.medicines || [])
      .map((m, idx) => {
        const brand = isBn ? (m.bengali_brand_name || m.brand_name) : m.brand_name;
        const dose = getDosageDisplay(m.dosage_bengali);
        const timing = getTimingDisplay(m.timing_bengali);
        const duration = getDurationDisplay(m.duration_bengali);
        const purpose = getPurposeDisplay(m.purpose_bengali, m.generic_name);
        const warnings = getSpecialWarningsDisplay(m.safety_warnings_bengali, m.generic_name);

        const warningsHtml =
          warnings && warnings.length > 0
            ? `
            <div style="margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 6px; font-size: 10px; color: #b91c1c;">
              <strong>${isBn ? 'বিশেষ সতর্কতা:' : 'Special Precaution:'}</strong> ${warnings.join(' • ')}
            </div>
          `
            : '';

        return `
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
              <div>
                <span style="font-size: 14px; font-weight: 700; color: #0f172a;">${brand}</span>
                <span style="font-size: 11px; color: #64748b; margin-left: 6px;">(${m.generic_name})</span>
              </div>
              <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: #475569;">
                ${isBn ? `ওষুধ ${idx + 1}` : `Medication ${idx + 1}`}
              </span>
            </div>
            <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
              <tr>
                <td style="width: 25%; color: #64748b; padding: 3px 0;">${isBn ? 'খাওয়ার নিয়ম:' : 'Dosage:'}</td>
                <td style="font-weight: 600; color: #0f172a;">${dose}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 3px 0;">${isBn ? 'সেবন সময়:' : 'Timing:'}</td>
                <td style="color: #334155;">${timing}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 3px 0;">${isBn ? 'মেয়াদ:' : 'Duration:'}</td>
                <td style="font-weight: 600; color: #b45309;">${duration}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 3px 0;">${isBn ? 'উদ্দেশ্য:' : 'Purpose:'}</td>
                <td style="color: #047857;">${purpose}</td>
              </tr>
            </table>
            ${warningsHtml}
          </div>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${isBn ? 'সহজ বাংলা রোগী নির্দেশিকা - PredictRx-AI' : 'Patient Medication Companion - PredictRx-AI'}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hind Siliguri", sans-serif;
            color: #0f172a;
            background: #ffffff;
            line-height: 1.4;
            padding: 0;
            margin: 0;
          }
          .header {
            border-bottom: 2px solid #0d9488;
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
              ${isBn ? 'সহজ বাংলা রোগী নির্দেশিকা (Bangla Patient Companion)' : 'Patient Medication Companion (Prescription Guidelines)'}
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <div><strong>${isBn ? 'রোগীর নাম:' : 'Patient Name:'}</strong> ${patientDisplay}</div>
            <div><strong>${isBn ? 'তারিখ:' : 'Date:'}</strong> ${dateDisplay}</div>
          </div>
        </div>

        ${criticalWarningHtml}

        <div style="margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #0f766e;">
          📋 ${isBn ? `ওষুধের তালিকা ও খাওয়ার নিয়ম (${data?.medicines?.length || 0}টি ওষুধ)` : `Medication Schedule & Directions (${data?.medicines?.length || 0} Medications)`}
        </div>

        ${medicinesHtml}

        <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-size: 11px; color: #475569; margin-top: 14px;">
          <strong>${isBn ? 'জরুরী পরামর্শ:' : 'Emergency Advisory:'}</strong> ${getEmergencyInstructionsDisplay(data?.emergency_instructions_bengali)}
        </div>

        <div class="footer">
          <div>${isBn ? 'চিকিৎসক অনুমোদিত ব্যাখ্যা: ' : 'Clinician Approved Explanation: '}<strong>${data.reviewer_name || (isBn ? 'নিবন্ধিত চিকিৎসক দ্বারা যাচাইকৃত' : 'Verified by Registered Physician')}</strong></div>
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
                  {isBn
                    ? 'সহজ বাংলা রোগী নির্দেশিকা (Bangla Patient Companion)'
                    : 'Patient Medication Companion (Prescription Guidelines)'}
                </CardTitle>
                <Badge variant="success" className="text-[10px]">
                  {isBn ? 'সহজবোধ্য ভাষা' : 'Patient-Friendly'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isBn
                  ? 'রোগী এবং স্বজনদের জন্য প্রেসক্রিপশনের ওষুধ সেবনের স্পষ্ট নিয়ম ও গুরুত্বপূর্ণ সতর্কতা'
                  : 'Clear medication schedule, directions, and essential safety guidelines for the patient and caregivers'}
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
              <span>
                {isPlaying
                  ? (isBn ? 'বন্ধ করুন (Stop)' : 'Stop Audio')
                  : (isBn ? 'শব্দে শুনুন (Listen)' : 'Listen (Voice Guide)')}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs flex items-center space-x-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>{isBn ? 'প্রিন্ট করুন (Print Card)' : 'Print Patient Card'}</span>
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
              {isBn
                ? `চিকিৎসক অনুমোদিত ব্যাখ্যা: ${data.reviewer_name || 'নিবন্ধিত চিকিৎসক দ্বারা যাচাইকৃত'}`
                : `Clinician Approved Explanation: ${data.reviewer_name || 'Verified by Registered Physician'}`}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {isBn ? 'তারিখ: ' : 'Date: '}
            {isBn ? data.date_bengali : new Date().toISOString().split('T')[0]}
          </span>
        </div>

        {/* Critical Safety Notice if Any */}
        {data.critical_safety_notice_bengali && (
          <div className="p-4 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-900 dark:text-red-300">
                  {isBn
                    ? 'জরুরী স্বাস্থ্য সতর্কতা (Important Safety Warning)'
                    : 'Important Safety Warning'}
                </h4>
                <p className="mt-1 text-xs leading-relaxed font-medium">
                  {getSafetyNoticeDisplay(data.critical_safety_notice_bengali)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Medicines Instruction Cards */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center space-x-2">
            <span>
              {isBn
                ? `ওষুধের তালিকা ও খাওয়ার সঠিক নিয়ম`
                : `Medication Schedule & Instructions`}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              ({data?.medicines?.length || 0} {isBn ? 'টি ওষুধ' : 'Medications'})
            </span>
          </h4>

          {(!data?.medicines || data.medicines.length === 0) ? (
            <div className="p-6 rounded-xl border border-dashed border-border text-center text-muted-foreground text-xs space-y-1">
              <p className="font-semibold text-foreground">
                {isBn ? 'কোনো ওষুধ তালিকাভুক্ত পাওয়া যায়নি' : 'No medications listed'}
              </p>
              <p>
                {isBn
                  ? 'প্রেসক্রিপশনটি পুনরায় স্ক্যান করুন অথবা উপরের ড্রপডাউন থেকে গোল্ডেন ডেমো প্রেসক্রিপশন নির্বাচন করুন।'
                  : 'Rescan prescription or load a clinical reference case from above.'}
              </p>
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
                        {isBn ? (med.bengali_brand_name || med.brand_name) : med.brand_name}
                      </h5>
                      <p className="text-xs text-muted-foreground">{med.generic_name}</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-teal-300 text-teal-800 dark:text-teal-300">
                      {isBn ? `ওষুধ ${idx + 1}` : `Medication ${idx + 1}`}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-muted">
                      <span className="text-muted-foreground">{isBn ? 'খাওয়ার নিয়ম:' : 'Dosage / Directions:'}</span>
                      <span className="font-semibold text-foreground text-right">{getDosageDisplay(med.dosage_bengali)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-muted">
                      <span className="text-muted-foreground">{isBn ? 'সেবন সময়:' : 'Timing:'}</span>
                      <span className="font-medium text-foreground text-right">{getTimingDisplay(med.timing_bengali)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-muted">
                      <span className="text-muted-foreground">{isBn ? 'কতোদিন খাবেন:' : 'Duration:'}</span>
                      <span className="font-medium text-amber-700 dark:text-amber-400 text-right">{getDurationDisplay(med.duration_bengali)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-muted">
                      <span className="text-muted-foreground">{isBn ? 'ওষুধটির উদ্দেশ্য:' : 'Purpose:'}</span>
                      <span className="font-medium text-teal-700 dark:text-teal-400 text-right">{getPurposeDisplay(med.purpose_bengali, med.generic_name)}</span>
                    </div>
                  </div>

                  {med.safety_warnings_bengali && med.safety_warnings_bengali.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-border/60">
                      <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">
                        {isBn ? 'বিশেষ সতর্কতা:' : 'Special Precautions:'}
                      </span>
                      <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                        {getSpecialWarningsDisplay(med.safety_warnings_bengali, med.generic_name).map((w, wIdx) => (
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
            <span className="font-semibold text-foreground">
              {isBn ? 'জরুরী পরামর্শ: ' : 'Emergency Advisory: '}
            </span>
            {getEmergencyInstructionsDisplay(data?.emergency_instructions_bengali)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
