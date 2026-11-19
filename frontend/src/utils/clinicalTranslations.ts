/**
 * PredictRx-AI Bilingual Clinical Translation Dictionary
 * Comprehensive localization helper for clinical alerts, issues, SHAP explainability, and interactions.
 */

export const CLINICAL_FEATURE_MAP_BN: Record<string, string> = {
  // Case 1: Ketorolac + CKD
  'Ketorolac Duration (14 Days)': 'কিটোরোলাকের মেয়াদ (১৪ দিন)',
  'Ketorolac Duration (14 days vs 5 day limit)': 'কিটোরোলাক গ্রহণের মেয়াদ (৫ দিনের বিপরীতে ১৪ দিন)',
  'Reduced Baseline eGFR (34.5 mL/min)': 'হ্রাসপ্রাপ্ত বেসলাইন eGFR (৩৪.৫ মিলি/মিনিট)',
  'Baseline eGFR (34.5 mL/min/1.73m²)': 'বেসলাইন eGFR (৩৪.৫ মিলি/মিনিট/১.৭৩মি²)',
  'Nephrotoxic Drug Collision (ARB + NSAID)': 'নেফ্রোটক্সিক ওষুধের মিথস্ক্রিয়া (ARB + NSAID)',
  'ARB + NSAID Interaction': 'ARB + NSAID ওষুধের মিথস্ক্রিয়া',
  'Elevated Serum Creatinine (2.1 mg/dL)': 'উচ্চ সিরাম ক্রিয়েটিনিন (২.১ মিগ্রা/ডিএল)',
  'Controlled Statin Therapy': 'নিয়ন্ত্রিত স্ট্যাটিন থেরাপি',
  'Patient Age (62 years)': 'রোগীর বয়স (৬২ বছর)',

  // Case 2: Triple Whammy
  'Triple Whammy Collision (ACEi + Diuretic + NSAID)': 'ট্রিপল হোয়ামি তীব্র ঝুঁকি (ACEi + Diuretic + NSAID)',
  'Triple Whammy Collision (ACEi/ARB + Diuretic + NSAID)': 'ট্রিপল হোয়ামি তীব্র ঝুঁকি (ACEi/ARB + Diuretic + NSAID)',
  'Moderate Renal Impairment (eGFR 52 mL/min)': 'মাঝারি কিডনি বৈকল্য (eGFR ৫২ মিলি/মিনিট)',
  'Systemic NSAID Exposure': 'সিস্টেমিক ব্যথানাশক (NSAID) সেবন',

  // Case 3: Pediatric Aspirin
  'Pediatric Age Vulnerability (8 Years)': 'শিশুর বয়স সংক্রান্ত ঝুঁকি (৮ বছর)',
  'Inappropriate Salicylate Exposure': 'অনুপযুক্ত স্যালিসিলেট (অ্যাসপিরিন) সেবন',
  'Pediatric Aspirin Exposure (8 Years)': 'শিশুর ক্ষেত্রে অ্যাসপিরিন সেবন (৮ বছর)',
  'Viral Illness Vulnerability': 'ভাইরাল জ্বরজনিত তীব্র ঝুঁকি',
};

export const CLINICAL_EXPLANATION_MAP_BN: Record<string, string> = {
  // Case 1
  'Therapy exceeds 5-day ceiling by 9 days, sharply multiplying nephrotoxic and ulcerogenic risks (BNF / FDA Black Box).':
    'চিকিৎসায় ৫ দিনের নির্ধারিত সীমা ৯ দিন অতিক্রম করেছে, যা কিডনির ক্ষতি ও পাকস্থলীর আলসারের ঝুঁকি বহুগুণ বাড়িয়ে দেয় (BNF / FDA ব্ল্যাক বক্স সতর্কতা)।',
  'Excess course duration is the primary driver of catastrophic nephrotoxic and peptic ulcer risk.':
    'অতিরিক্ত সময় ওষুধ ব্যবহারের ফলে মারাত্মক নেফ্রোটক্সিক এবং পেপটিক আলসারের চরম ঝুঁকি তৈরি হয়।',
  'Severely compromised filtration rate diminishes renal functional reserve, accelerating progression to dialysis.':
    'মারাত্মকভাবে কমে যাওয়া ছাঁকন ক্ষমতা কিডনির রিজার্ভ নষ্ট করে দেয়, যা দ্রুত ডায়ালাইসিসের ঝুঁকি তৈরি করে।',
  'Stage 3b CKD leaves virtually no functional renal reserve to absorb prostaglandin inhibition.':
    'স্টেজ 3b CKD থাকার কারণে প্রোস্টাগ্ল্যান্ডিন বাধা শোষণ করার মতো কিডনির কোনো কার্যকরী সক্ষমতা অবশিষ্ট থাকে না।',
  'Combined efferent dilation and afferent constriction collapses glomerular hydrostatic filtration pressure.':
    'ইফারেন্ট প্রসারণ এবং অ্যাফারেন্ট সংকোচনের কারণে গ্লোমেরুলার হাইড্রোস্ট্যাটিক ছাঁকন চাপ ভেঙে পড়ে।',
  'Dual assault on renal perfusion: ARB impairs efferent tone while NSAID blocks afferent prostaglandins.':
    'কিডনির রক্ত সঞ্চালনে দ্বৈত আঘাত: ARB ইফারেন্ট টোন ব্যাহত করে এবং NSAID অ্যাফারেন্ট প্রোস্টাগ্ল্যান্ডিন ব্লক করে।',
  'Baseline creatinine of 2.1 confirms established renal parenchymal impairment.':
    'বেসলাইন ক্রিয়েটিনিন ২.১ নিশ্চিত করে যে রোগীর কিডনি আগে থেকেই ক্ষতিগ্রস্ত।',
  'Long-term statin use stabilizes vascular endothelium, providing minor systemic protective buffering.':
    'দীর্ঘমেয়াদী স্ট্যাটিন ব্যবহার ভাস্কুলার এন্ডোথেলিয়াম স্থিতিশীল রাখে, যা সামান্য পদ্ধতিগত সুরক্ষামূলক বাফার প্রদান করে।',
  'Moderate geriatric vulnerability increases susceptibility to acute toxic nephropathy.':
    'বয়োবৃদ্ধির কারণে তীব্র বিষাক্ত নেফ্রোপ্যাথি হওয়ার সংবেদনশীলতা বৃদ্ধি পায়।',

  // Case 2
  'Concurrent intravascular volume depletion, efferent arteriolar vasodilation, and afferent constriction destroys renal autoregulation.':
    'শরীরে তরলের ঘাটতি, রক্তনালীর ইফারেন্ট প্রসারণ এবং অ্যাফারেন্ট সংকোচন একত্রে কিডনির স্ব-নিয়ন্ত্রণ ব্যবস্থা ভেঙে ফেলে।',
  'Simultaneous afferent vasoconstriction, efferent vasodilation, and volume contraction causes acute GFR collapse.':
    'একই সাথে অ্যাফারেন্ট ভাসোকনস্ট্রিকশন, ইফারেন্ট ভাসোডিলেশন এবং তরল হ্রাস কিডনির কার্যক্ষমতায় তীব্র পতন ঘটায়।',
  'Pre-existing borderline renal clearance exacerbates hemodynamic toxicity.':
    'পূর্ববর্তী সীমান্ত রেখার কিডনি ক্লিয়ারেন্স ওষুধের বিষক্রিয়াকে আরও ত্বরান্বিত করে।',
  'Reduced baseline nephron clearance diminishes renal reserve.':
    'হ্রাসপ্রাপ্ত কিডনি ক্লিয়ারেন্স রেনাল রিজার্ভ কমিয়ে দেয়।',
  'Oral NSAID blocks prostaglandin synthesis essential for renal compensatory perfusion.':
    'মুখে খাওয়ার ব্যথানাশক ওষুধ কিডনির রক্ত সঞ্চালনের জন্য প্রয়োজনীয় প্রোস্টাগ্ল্যান্ডিন তৈরিতে বাধা দেয়।',

  // Case 3
  'Salicylate administration in pediatric viral flu directly uncouples hepatic oxidative phosphorylation, triggering lethal Reye\'s syndrome.':
    'ভাইরাল জ্বরে আক্রান্ত শিশুদের অ্যাসপিরিন দিলে তা লিভারের মাইটোকন্ড্রিয়ার স্বাভাবিক কাজ বন্ধ করে প্রাণঘাতী রে সিন্ড্রোম ঘটায়।',
  'Active viral replication primes hepatic and cerebral mitochondria to toxin-induced apoptosis.':
    'সক্রিয় ভাইরাস লিভার ও মস্তিষ্কের কোষগুলোকে ওষুধের বিষক্রিয়ার প্রতি অত্যন্ত সংবেদনশীল করে তোলে।',
  'Immature hepatic mitochondrial clearance makes salicylates lethal during viral infection.':
    'অপূর্ণাঙ্গ লিভার কার্যক্ষমতার কারণে ভাইরাল সংক্রমণের সময় স্যালিসিলেট মারাত্মক বিপজ্জনক রূপ নেয়।',
  "Aspirin during viral flu triggers Reye's syndrome with acute encephalopathy.":
    'ভাইরাল ফ্লুর সময় অ্যাসপিরিন তীব্র এনসেফালোপ্যাথি সহ রে সিন্ড্রোম সৃষ্টি করতে পারে।',
};

export const CLINICAL_ISSUES_MAP_BN: Record<string, string> = {
  // Codes
  'MAX_DURATION_EXCEEDED': 'সর্বোচ্চ মেয়াদ অতিক্রান্ত',
  'CONTRAINDICATION_CKD': 'কিডনি রোগে নিষিদ্ধ',
  'NEPHROTOXIC_ARB_NSAID': 'নেফ্রোটক্সিক ওষুধের সংঘাত',
  'CKD_MONITORING': 'কিডনি পর্যবেক্ষণ',
  'TRIPLE_WHAMMY_SYNDROME': 'ট্রিপল হোয়ামি সিন্ড্রোম',
  'CONTRAINDICATION_REYES_SYNDROME': 'রে সিন্ড্রোমের ঝুঁকি',
  'DOSE_FORMAT_INVALID': 'ডোজ ফরম্যাট অস্পষ্ট বা অসংলগ্ন',
  'DURATION_MISSING': 'ওষুধের মেয়াদ অনুপস্থিত',
  'DOSE_HIGH': 'ডোজের মাত্রা অতিমাত্রায় বেশি',
  'DOSE_LOW': 'ডোজের মাত্রা অত্যন্ত কম',
  'FREQUENCY_INVALID': 'সেবনের পুনরাবৃত্তি অস্পষ্ট',
  'ROUTE_INVALID': 'ওষুধ প্রয়োগের মাধ্যম অস্পষ্ট',
  'FORM_INCOMPATIBLE': 'ওষুধের ধরন সামঞ্জস্যপূর্ণ নয়',

  // Messages
  'Ketorolac duration (14 days) exceeds strict maximum 5-day course safety ceiling. High risk of Acute Kidney Injury (AKI) and GI hemorrhage.':
    'কিটোরোলাকের মেয়াদ (১৪ দিন) সর্বোচ্চ ৫ দিনের নিরাপত্তা সীমা অতিক্রম করেছে। একিউট কিডনি ইনজুরি (AKI) এবং গ্যাস্ট্রিক রক্তক্ষরণের চরম ঝুঁকি।',
  'Ketorolac is contraindicated in moderate-to-severe renal impairment (Patient eGFR 34.5 ml/min, Creatinine 2.1 mg/dL).':
    'মাঝারি থেকে তীব্র কিডনি বৈকল্যে কিটোরোলাক সম্পূর্ণ নিষিদ্ধ (রোগীর eGFR ৩৪.৫ মিলি/মিনিট, ক্রিয়েটিনিন ২.১ মিগ্রা/ডিএল)।',
  'Concomitant use with Olmesartan (ARB) causes bilateral renal hemodynamic collapse.':
    'ওলমেসারটান (ARB)-এর সাথে যুগপৎ সেবনে কিডনির রক্ত সঞ্চালনে তীব্র পতন ঘটে।',
  'Olmesartan (ARB component): Baseline eGFR is 34.5 ml/min: monitor serum creatinine and potassium within 14 days.':
    'ওলমেসারটান (ARB উপাদান): রোগীর বেসলাইন eGFR হলো ৩৪.৫ মিলি/মিনিট; ১৪ দিনের মধ্যে সিরাম ক্রিয়েটিনিন এবং পটাসিয়াম পর্যবেক্ষণ করুন।',
  'Triple Whammy collision: ACEi (Ramipril) + Diuretic (Furosemide) + NSAID (Diclofenac) destroys glomerular autoregulation.':
    'ট্রিপল হোয়ামি সংঘাত: ACEi (Ramipril) + Diuretic (Furosemide) + NSAID (Diclofenac) একত্রে কিডনির ছাঁকন ক্ষমতা ধ্বংস করে।',
  'Aspirin in children < 16 years during suspected viral illness is strictly contraindicated due to lethal Reye syndrome risk.':
    'ভাইরাল জ্বরে আক্রান্ত ১৬ বছরের কম বয়সী শিশুদের ক্ষেত্রে অ্যাসপিরিন প্রাণঘাতী রে সিন্ড্রোমের কারণে সম্পূর্ণ নিষিদ্ধ।',
};

export const CLINICAL_INTERACTIONS_MAP_BN: Record<string, { mechanism: string; significance: string; action: string; source: string }> = {
  'DI-01-KETOROLAC-OLMESARTAN': {
    mechanism: 'ARB দ্বারা ইফারেন্ট রক্তনালী প্রসারণ এবং NSAID দ্বারা অ্যাফারেন্ট রক্তনালী সংকোচনের ফলে কিডনির ছাঁকন ক্ষমতা (GFR) আকস্মিকভাবে কমে যায়।',
    significance: 'তীব্র কিডনি বৈকল্য (Acute Renal Decompensation) এবং উচ্চ রক্তচাপ নিয়ন্ত্রণের কার্যকারিতা হ্রাসের চরম ঝুঁকি।',
    action: 'কিটোরোলাক অনতিবিলম্বে বন্ধ করুন। কিডনির ক্ষতি করে না এমন নিরাপদ ব্যথানাশক (প্যারাসিটামল) ব্যবহার করুন।',
    source: 'কেডিআইজিও (KDIGO) ক্লিনিক্যাল প্র্যাকটিস গাইডলাইন ২০২৪',
  },
  'DI-02-TRIPLE-WHAMMY': {
    mechanism: 'ট্রিপল হোয়ামি: ACEi + Diuretic + NSAID একত্রে কিডনির স্ব-নিয়ন্ত্রণ ধ্বংস করে একিউট টিউবুলার নেক্রোসিস ঘটায়।',
    significance: 'আকস্মিক কিডনি ফেইলিউর এবং জরুরি ডায়ালাইসিস লাগার উচ্চ ঝুঁকি।',
    action: 'মুখে খাওয়ার ভোল্টালিন (ডাইক্লোফেনাক) অবিলম্বে বন্ধ করুন। ব্যথানাশক হিসেবে নিরাপদ প্যারাসিটামল বা টপিক্যাল মলম ব্যবহার করুন।',
    source: 'সিএমএজে ২০১৩ / বিএনএফ ৮৪ (CMAJ 2013 / BNF 84)',
  },
  'DI-03-ASPIRIN-VIRAL': {
    mechanism: 'ভাইরাস আক্রান্ত মাইটোকন্ড্রিয়া স্যালিসিলেটের প্রভাবে তীব্র অক্সিডেটিভ ধ্বংসের মুখে পড়ে।',
    significance: 'মারাত্মক হেপাটিক এনসেফালোপ্যাথি এবং সেরিব্রাল ইডিমা (রে সিন্ড্রোমে মৃত্যুর হার ৩০-৪০%)।',
    action: 'অ্যাসপিরিন অবিলম্বে প্রত্যাহার করুন এবং শিশুদের জ্বর নিয়ন্ত্রণে প্যারাসিটামল ব্যবহার করুন।',
    source: 'আমেরিকান একাডেমি অব পেডিয়াট্রিক্স (AAP Guideline)',
  },
  'INT-DLB-01': {
    mechanism: 'কোয়েটা এক্সআর (ডোপামিন D2 ব্লকার) সিনডোপার (ডোপামিন বৃদ্ধি) কার্যকারিতাকে বাধা দিতে পারে।',
    significance: 'অতিরিক্ত মাত্রায় কোয়েটিয়াপাইন ব্যবহার করলে পারকিনসোনিজমের মটর জড়তা ও হাঁটাচলায় ধীরগতি বাড়তে পারে।',
    action: 'হ্যালুসিনেশন নিয়ন্ত্রণে কোয়েটা এক্সআর সর্বনিম্ন কার্যকর মাত্রায় রাখুন এবং চলাফেরার মটর লক্ষণ পর্যবেক্ষণ করুন।',
    source: 'মুভমেন্ট ডিজঅর্ডার সোসাইটি (MDS) / NICE DLB গাইডলাইন ২০২৪',
  },
  'INT-DLB-02': {
    mechanism: 'রিভাক্যাপ (কোলিনএস্টারেজ ইনহিবিটর) এবং ইউরোম্যাক্স (আলফা-১ ব্লকার) উভয়ই রক্তচাপ হ্রাস করতে পারে।',
    significance: 'বয়স্ক রোগীদের শোয়া বা বসা থেকে হঠাৎ উঠে দাঁড়ানোর সময় রক্তচাপ কমে যাওয়া ও মাথা ঘুরে পড়ে যাওয়ার ঝুঁকি।',
    action: 'রোগী ও স্বজনদের হঠাৎ দ্রুত না দাঁড়িয়ে ধীরে ধীরে বসা থেকে ওঠার পরামর্শ দিন। নিয়মিত ব্লাড প্রেশার মাপুন।',
    source: 'আমেরিকান জেরিয়াট্রিক সোসাইটি বিয়ার্স ক্রাইটেরিয়া ২০২৩',
  },
};

export const CLINICAL_ALTERNATIVES_MAP_BN: Record<string, { rationale: string; safetyBenefit: string }> = {
  'Rolac 10': {
    rationale: 'কিডনি-বান্ধব ব্যথানাশক যা সিকেডি স্টেজ ৩-এর জন্য নিরাপদ। কিডনির প্রোস্টাগ্ল্যান্ডিন ক্ষতিগ্রস্ত না করেই দীর্ঘস্থায়ী ব্যথা নিয়ন্ত্রণ করে।',
    safetyBenefit: 'কিডনির রক্তনালী প্রসারক প্রোস্টাগ্ল্যান্ডিনে কোনো বাধা দেয় না; গ্যাস্ট্রিক রক্তক্ষরণ এবং রেনাল প্যাপিলারি নেক্রোসিস সম্পূর্ণ প্রতিরোধ করে।',
  },
  'Voltalin 50mg': {
    rationale: 'টপিক্যাল জেল ব্যবহারে রক্তে ওষুধ খুব কম মেশে এবং কিডনির রক্ত সঞ্চালন সম্পূর্ণ অক্ষুণ্ণ রেখে সরাসরি জয়েন্টের ব্যথা দূর করে।',
    safetyBenefit: 'শরীরে প্রোস্টাগ্ল্যান্ডিনের ক্ষতি ছাড়াই অস্টিওআর্থারাইটিসের ব্যথা কার্যকরভাবে উপশম করে।',
  },
  'Ecospirin 75mg': {
    rationale: 'প্যারাসিটামল শিশুদের জন্য নিরাপদ প্রথম সারির জ্বর ও ব্যথানাশক, যা রে সিন্ড্রোম বা লিভারের কোনো ক্ষতি করে না।',
    safetyBenefit: 'শিশুদের ক্ষেত্রে রে সিন্ড্রোম এবং মস্তিষ্কের প্রদাহের (এনসেফালোপ্যাথি) প্রাণঘাতী ঝুঁকি সম্পূর্ণ দূর করে।',
  },
};

// Helper translation functions
export function translateFeatureName(name: string, isBn: boolean): string {
  if (!isBn) return name;
  return CLINICAL_FEATURE_MAP_BN[name] || name;
}

export function translateClinicalExplanation(exp: string, isBn: boolean): string {
  if (!isBn) return exp;
  return CLINICAL_EXPLANATION_MAP_BN[exp] || exp;
}

export function translateObservedValue(val: any, isBn: boolean): string {
  if (!isBn || val === null || val === undefined) return String(val);
  const str = String(val);
  const valMap: Record<string, string> = {
    '14 days': '১৪ দিন',
    '30 days': '৩০ দিন',
    '10 days': '১০ দিন',
    '5 days': '৫ দিন',
    'Present': 'উপস্থিত',
    'Absent': 'অনুপস্থিত',
    '34.5 mL/min': '৩৪.৫ মিলি/মিনিট',
    '52 mL/min': '৫২ মিলি/মিনিট',
    '110 mL/min': '১১০ মিলি/মিনিট',
    '2.1 mg/dL': '২.১ মিগ্রা/ডিএল',
    '1.3 mg/dL': '১.৩ মিগ্রা/ডিএল',
    '0.5 mg/dL': '০.৫ মিগ্রা/ডিএল',
    'Diclofenac 50mg': 'ডাইক্লোফেনাক ৫০মিগ্রা',
  };
  return valMap[str] || str;
}

export function translateCategoryName(cat: string, isBn: boolean): string {
  if (!isBn) return cat;
  const catMap: Record<string, string> = {
    'Duration': 'সময়সীমা',
    'Renal': 'কিডনি সংক্রান্ত',
    'Interaction': 'ওষুধের পারস্পরিক ক্রিয়া',
    'Protective': 'সুরক্ষামূলক',
    'Age': 'বয়স',
    'Dosage': 'ডোজের মাত্রা',
  };
  return catMap[cat] || cat;
}

export function translateIssueCode(code: string, isBn: boolean): string {
  if (!isBn) return code;
  return CLINICAL_ISSUES_MAP_BN[code] || code;
}

export function translateIssueMessage(msg: string, isBn: boolean): string {
  if (!isBn) return msg;
  if (CLINICAL_ISSUES_MAP_BN[msg]) return CLINICAL_ISSUES_MAP_BN[msg];
  if (msg.toLowerCase().includes('unrecognised dosage format') || msg.toLowerCase().includes('unrecognized dosage format')) {
    const matched = msg.match(/'([^']+)'/);
    const code = matched ? matched[1] : '';
    return code ? `অস্বীকৃত ডোজ ফরম্যাট '${code}' (চিকিৎসকের যাচাই আবশ্যক)` : 'অস্বীকৃত বা অস্পষ্ট ডোজ ফরম্যাট';
  }
  if (msg.toLowerCase().includes('duration not specified')) {
    return 'প্রেসক্রিপশনে কত দিন খাবেন তা নির্দিষ্ট করা নেই (মেয়াদ যাচাই আবশ্যক)';
  }
  return msg;
}

export function translateTimingText(timing?: string, isBn?: boolean): string {
  if (!timing) return '';
  if (!isBn) return timing;
  const timingMap: Record<string, string> = {
    'Morning After Breakfast': 'সকালে খাবারের পর',
    'After Meal': 'খাবারের পর',
    'Before Meal': 'খাবারের আগে',
    'Morning': 'সকালে',
    'Night': 'রাতে',
    'Bedtime': 'ঘুমানোর আগে',
    'Twice Daily': 'দিনে ২ বার',
    'Thrice Daily': 'দিনে ৩ বার',
  };
  return timingMap[timing] || timing;
}

export function translateFormText(form?: string, isBn?: boolean): string {
  if (!form) return isBn ? 'ট্যাবলেট' : 'Tablet';
  if (!isBn) return form;
  const formMap: Record<string, string> = {
    'Tablet': 'ট্যাবলেট',
    'Tab': 'ট্যাবলেট',
    'Capsule': 'ক্যাপসুল',
    'Cap': 'ক্যাপসুল',
    'Syrup': 'সিরাপ',
    'Syp': 'সিরাপ',
    'Injection': 'ইনজেকশন',
    'Inj': 'ইনজেকশন',
    'Suspension': 'সাসপেনশন',
    'Ointment': 'মলম',
    'Gel': 'জেল',
  };
  return formMap[form] || form;
}
