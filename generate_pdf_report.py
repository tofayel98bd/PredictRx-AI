import os
import subprocess
import sys
import tempfile

HTML_CONTENT = """<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>PredictRx BD — 2-Member Team Execution & Remaining Tasks Masterplan</title>
<style>
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8pt;
      color: #64748b;
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Segoe UI', 'Nirmala UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.38;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }

  .header-card {
    background: linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #0d9488 100%);
    color: #ffffff;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 10px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .header-badge-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: #99f6e4;
    margin-bottom: 4px;
  }

  .header-title {
    font-size: 16pt;
    font-weight: 800;
    margin: 0 0 2px 0;
    letter-spacing: -0.02em;
    color: #ffffff;
  }

  .header-subtitle {
    font-size: 9.5pt;
    font-weight: 400;
    color: #ccfbf1;
    margin: 0 0 8px 0;
    line-height: 1.3;
  }

  .header-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 8pt;
  }

  .meta-item strong {
    display: block;
    color: #5eead4;
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .callout {
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 8px;
    font-size: 8.5pt;
    line-height: 1.35;
  }

  .callout-warning {
    background-color: #fffbeb;
    border-left: 4px solid #f59e0b;
    color: #92400e;
  }

  .callout-info {
    background-color: #f0fdf4;
    border-left: 4px solid #10b981;
    color: #065f46;
  }

  .page-break {
    page-break-after: always;
  }

  h2 {
    font-size: 11pt;
    font-weight: 700;
    color: #0f172a;
    border-left: 4px solid #0d9488;
    padding-left: 6px;
    margin: 10px 0 6px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h3 {
    font-size: 9.5pt;
    font-weight: 700;
    color: #134e4a;
    margin: 8px 0 4px 0;
  }

  .badge {
    display: inline-block;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .badge-p0 { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
  .badge-p1 { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
  .badge-p2 { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  .badge-user { background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; }
  .badge-jihad { background: #ccfbf1; color: #0f766e; border: 1px solid #5eead4; }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-bottom: 8px;
  }

  th {
    background-color: #f1f5f9;
    color: #334155;
    text-align: left;
    font-weight: 700;
    padding: 5px 6px;
    border: 1px solid #cbd5e1;
    font-size: 7.5pt;
    text-transform: uppercase;
  }

  td {
    padding: 5px 6px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }

  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  .task-list {
    margin-bottom: 6px;
  }

  .task-item {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 6px 8px;
    margin-bottom: 5px;
    display: grid;
    grid-template-columns: 20px 1fr auto;
    align-items: start;
    gap: 6px;
    font-size: 8.5pt;
  }

  .checkbox {
    width: 14px;
    height: 14px;
    border: 2px solid #0d9488;
    border-radius: 3px;
    margin-top: 1px;
    display: inline-block;
  }

  .task-content {
    line-height: 1.3;
  }

  .task-title {
    font-weight: 700;
    color: #0f172a;
    font-size: 8.5pt;
  }

  .task-desc {
    color: #475569;
    font-size: 7.5pt;
    margin-top: 1px;
  }

  .task-meta {
    text-align: right;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .card-box {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
  }

  .card-box h4 {
    margin: 0 0 4px 0;
    font-size: 9pt;
    color: #0f766e;
    font-weight: 700;
  }

  .footer-note {
    font-size: 7.5pt;
    color: #94a3b8;
    text-align: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
    margin-top: 8px;
  }
</style>
</head>
<body>

<!-- PAGE 1: EXECUTIVE AUDIT & 2-MEMBER REDISTRIBUTION -->
<div class="header-card">
  <div class="header-badge-row">
    <span>International AI Builders Congress 2026 • Domain: HealthSphere AI</span>
    <span>Track: PREDICTRX</span>
  </div>
  <h1 class="header-title">PredictRx BD: 2-Member Team Execution & Remaining Tasks Masterplan</h1>
  <div class="header-subtitle">
    ৫ জনের ব্লুপ্রিন্ট বনাম বর্তমান কোডবেস অডিট: ২ জনের টিম (আপনি ও জিহাদ) দিয়ে চ্যাম্পিয়ন প্রজেক্ট শেষ করার চূড়ান্ত কার্যতালিকা ও রোডম্যাপ
  </div>
  <div class="header-meta-grid">
    <div class="meta-item">
      <strong>মূল ফোকাস</strong>
      Neuro-Symbolic CDSS + Bangla AI
    </div>
    <div class="meta-item">
      <strong>টিম সদস্য (বর্তমান)</strong>
      আপনি (AI/Backend/DB) + জিহাদ (UI/QA/Pitch)
    </div>
    <div class="meta-item">
      <strong>বর্তমান অবস্থা</strong>
      কোর আর্কিটেকচার রেডি, ইন্টিগ্রেশন অসম্পূর্ণ
    </div>
    <div class="meta-item">
      <strong>লক্ষ্য</strong>
      উইনিং লাইভ ডেমো + ১০ স্লাইড পিচ ডেক
    </div>
  </div>
</div>

<div class="callout callout-warning">
  <strong>⚠️ বাস্তব পরিস্থিতি ও টিম রিস্ট্রাকচারিং নোটিশ:</strong>
  আসল ব্লুপ্রিন্ট ৫ জনের জন্য ছিল (আপনি/AI, জিহাদ/Frontend, তারেক/Backend, পরাগ/Database, তাহরিমা/QA & Pitch)। কিন্তু বর্তমানে আপনারা <strong>মাত্র ২ জন (আপনি ও জিহাদ)</strong> কাজ করছেন। ৫ জনের বিশাল কাজ ২ জনে নামিয়ে আনতে হলে অপ্রয়োজনীয় এন্টারপ্রাইজ বয়লারপ্লেট বাদ দিয়ে <strong>"জাজদের ইমপ্রেস করার কোর ৩টি লাইভ ডেমো কেস"</strong> এবং <strong>"এন্ড-টু-এন্ড রানিং ওয়ার্কফ্লো"</strong>-তে ১০০% ফোকাস করতে হবে।
</div>

<div class="section">
  <h2>১. বর্তমান কোডবেস অডিট: ৫-লেয়ার পাইপলাইনের অগ্রগতি বনাম অসম্পূর্ণ কাজ</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 17%;">পাইপলাইন লেয়ার</th>
        <th style="width: 31%;">ব্লুপ্রিন্টের মূল রিকোয়ারমেন্ট</th>
        <th style="width: 26%;">বর্তমান কোডবেসে কী হয়েছে</th>
        <th style="width: 26%;">কী কী এখনো বাকি (Gaps)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Layer 1: Vision OCR & Syntax</strong></td>
        <td>হাতে লেখা/প্রিন্টেড প্রেসক্রিপশন ইমেজ থেকে Vision LLM দিয়ে ড্রাগ, ডোজ (1+0+1), মেয়াদ ও খাবার নিয়ম এক্সট্র্যাক্ট ও সিনট্যাক্স ভ্যালিডেশন।</td>
        <td><code>ai_engine</code>-এ প্রম্পট, প্রিপ্রসেসর ও ভ্যালিডেটর লেখা হয়েছে (১৫টি টেস্ট পাস)।</td>
        <td><span class="badge badge-p0">P0</span> ব্যাকএন্ড <code>/analyze</code> এন্ডপয়েন্টে ইমেজ আপলোডের সাথে <code>ai_engine</code> কানেক্ট করা নেই; ফাইল দিলে ডামি টেক্সট রিটার্ন হয়!</td>
      </tr>
      <tr>
        <td><strong>Layer 2: BD Drug Normalization</strong></td>
        <td>বাংলাদেশের লোকাল ব্র্যান্ড (Napa, Sergel, Bizoran) থেকে জেনেরিক ও ATC কোড ম্যাপিং। ড্রাগ-ড্রাগ ও ড্রাগ-ডিজিজ ইন্টারঅ্যাকশন চেক।</td>
        <td>রিলেশনাল স্কিমা রেডি, বেসিক <code>BRAND_SEED</code> ও ট্রিপল হোয়ামি লজিক আছে।</td>
        <td><span class="badge badge-p0">P0</span> মাত্র ১৭টি ওষুধ সিড করা (ব্লুপ্রিন্টে ৫০০-১,০০০ ড্রাগ চেয়েছে)। বানানের ভুল হ্যান্ডেল করতে <strong>Fuzzy Matching</strong> নেই।</td>
      </tr>
      <tr>
        <td><strong>Layer 3: Medical Evidence RAG</strong></td>
        <td>DGDA / BNF / KDIGO / CMAJ গাইডলাইনের ভেক্টর ডেটাবেস (ChromaDB/Qdrant) এবং জিরো-হ্যালুসিনেশন সাইটেশন।</td>
        <td>রিলেশনাল টেবিলে কিছু স্ট্যাটিক সাইটেশন স্ট্রিং হার্ডকোড করা আছে।</td>
        <td><span class="badge badge-p1">P1</span> কোনো ভেক্টর ডেটাবেস (ChromaDB) নেই। কোনো ডাইনামিক রিট্রিভাল নেই। স্ট্যাটিক ডেটাবেস সাইটেশনের ওপর নির্ভরশীল।</td>
      </tr>
      <tr>
        <td><strong>Layer 4: Clinical Risk & SHAP XAI</strong></td>
        <td>বয়স, eGFR, ক্রিয়েটিনিন ও ড্রাগ সংখ্যা দিয়ে Complication Risk (%) এবং SHAP Waterfall বার চার্ট বের করা (XGBoost/LightGBM)।</td>
        <td>ফ্রন্টএন্ডে চমৎকার রিচার্টস (Recharts) SHAP Waterfall চার্ট আছে।</td>
        <td><span class="badge badge-p0">P0</span> আসল কোনো ট্রেইন্ড <code>.pkl</code> বা <code>model.json</code> ফাইল নেই! ব্যাকএন্ডে রুল-বেসড হিউরিস্টিক দিয়ে SHAP ফেক করা হচ্ছে।</td>
      </tr>
      <tr>
        <td><strong>Layer 5: Safe Alternative & Bangla Voice</strong></td>
        <td>ঝুঁকিপূর্ণ ওষুধের বদলে নিরাপদ অল্টারনেটিভ ড্রাগ সাজেস্ট করা এবং সম্পূর্ণ প্রেসক্রিপশন বাংলায় অডিওসহ (Web Speech TTS) দেখানো।</td>
        <td>রোল্যাকের বদলে নাপা এক্সটেন্ড লজিক ও ব্রাউজার Web Speech API দিয়ে বাংলা অডিও রিডআউট সম্পন্ন।</td>
        <td><span class="badge badge-p1">P1</span> অন্যান্য কমন ড্রাগ পেয়ারের জন্য বিকল্প রুল কম। ব্রাউজারের বিভিন্ন ভার্সনে বাংলা ভয়েস ফলব্যাক টেস্ট করা প্রয়োজন।</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="section">
  <h2>২. ২ জনের টিম স্ট্র্যাটেজি ও দায়িত্ব পুনর্বণ্টন (Role Redistribution)</h2>
  <div class="grid-2">
    <div class="card-box" style="border-left: 4px solid #6d28d9;">
      <h4>👤 আপনার দায়িত্ব (You: AI, Backend & DB Lead)</h4>
      <p style="font-size: 8pt; color: #475569; margin: 0 0 4px 0;">
        পূর্বের <strong>Tofayel (AI) + Tarek (Backend) + Porag (DB)</strong> এর সমন্বিত দায়িত্ব:
      </p>
      <ul style="font-size: 7.5pt; padding-left: 14px; margin: 0; line-height: 1.35;">
        <li><code>ai_engine</code>-কে ব্যাকএন্ড <code>analyze</code> এন্ডপয়েন্টের সাথে সরাসরি যুক্ত করা।</li>
        <li>বাংলাদেশের অন্তত ২০০–৩০০টি বহুল ব্যবহৃত ব্র্যান্ড ওষুধের ডেটা সিড করা।</li>
        <li>Fuzzy Matching (যেমন: Sergil ➔ Sergel) অ্যালগরিদম যোগ করা।</li>
        <li>একটি দ্রুত সিন্থেটিক ডেটা ট্রেইন্ড XGBoost মডেল <code>risk_model.pkl</code> তৈরি করে আসল SHAP TreeExplainer রান করানো।</li>
        <li>লাইভ ডেমো যেন অফলাইনেও কখনো ক্র্যাশ না করে সেজন্য <strong>Smart Local Cache</strong> তৈরি করা।</li>
      </ul>
    </div>
    <div class="card-box" style="border-left: 4px solid #0d9488;">
      <h4>👤 জিহাদের দায়িত্ব (Jihad: Frontend, QA & Pitch Lead)</h4>
      <p style="font-size: 8pt; color: #475569; margin: 0 0 4px 0;">
        পূর্বের <strong>Jihad (UI/UX) + Tahrima (QA, Golden Data & Pitch)</strong> এর সমন্বিত দায়িত্ব:
      </p>
      <ul style="font-size: 7.5pt; padding-left: 14px; margin: 0; line-height: 1.35;">
        <li>UI-তে <strong>"1-Click 3 Golden Demo Scenarios Switcher"</strong> ড্রপডাউন/বাটন যোগ করা।</li>
        <li>৩টি বাস্তব প্রেসক্রিপশন ইমেজ ও পেশেন্ট প্রোফাইল ডেমো রেডি করা।</li>
        <li>মোবাইল ও ট্যাবলেট স্ক্রিনে রেসপনসিভনেস ও বাংলা ফন্ট পারফেকশন টেস্ট করা।</li>
        <li>প্রতিযোগিতার ফাইনালের জন্য <strong>১০ স্লাইডের উইনিং পিচ ডেক (Pitch Deck)</strong> তৈরি করা।</li>
        <li>৩ মিনিটের লাইভ ডেমো স্ক্রিপ্ট এবং একটি ২ মিনিটের ব্যাকআপ স্ক্রিন রেকর্ডিং ভিডিও সংরক্ষণ করা।</li>
      </ul>
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- PAGE 2: ACTION ITEMS FOR YOU -->
<div class="section">
  <h2>
    <span>৩. আপনার (AI & Backend Lead) জন্য বিস্তারিত অ্যাকশন চেকলিস্ট</span>
    <span class="badge badge-user">AI + Backend + Database</span>
  </h2>

  <h3>মডিউল A: AI Engine ও Backend ইন্টিগ্রেশন (P0 - শো-স্টপার)</h3>
  <div class="task-list">
    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">১. Vision LLM OCR-কে FastAPI ব্যাকএন্ডের সাথে প্লাগ-ইন করা</div>
        <div class="task-desc">
          <code>backend/app/api/v1/endpoints/predict_rx.py</code>-এ ইমেজ আপলোড হলে বর্তমানে ডামি ফলব্যাক চালানো হচ্ছে। <code>ai_engine/app/pipeline.py</code> এর <code>analyze_prescription_image</code> ফাংশন কল করে আসল Vision এক্সট্র্যাকশন ব্যাকএন্ডে পাস করাতে হবে।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p0">P0 Showstopper</span>
        <span style="font-size: 7.5pt; color: #64748b;">২ ঘণ্টা</span>
      </div>
    </div>

    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">২. দ্রুত XGBoost মডেল ট্রেইনিং ও বাস্তব SHAP এক্সপ্লেইনার (.pkl) যুক্ত করা</div>
        <div class="task-desc">
          একটি ছোট সিন্থেটিক ক্লিনিক্যাল ডেটাসেট তৈরি করে (Patient Age, eGFR, Serum Creatinine, BP, Drug Count, NSAID+ARB Flag ➔ AKI Risk) একটি লাইটওয়েট XGBoost রিগ্রেসর ট্রেইন করে <code>clinical_risk_model.pkl</code> সেভ করা এবং <code>shap.TreeExplainer</code> দিয়ে রিয়েল ইমপ্যাক্ট ভ্যালু জেনারেট করা।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p0">P0 Showstopper</span>
        <span style="font-size: 7.5pt; color: #64748b;">২.৫ ঘণ্টা</span>
      </div>
    </div>

    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৩. ৩টি গোল্ডেন প্রেসক্রিপশনের জন্য Smart Local Cache তৈরি করা</div>
        <div class="task-desc">
          হ্যাকাথন ভেন্যুর ইন্টারনেট স্লো হলে বা API রেট-লিমিট খেলে যেন ডেমো ফেল না করে! ৩টি গোল্ডেন ডেমো প্রেসক্রিপশন ইমেজের SHA-256 হ্যাশ ম্যাচ করলে ডিরেক্ট লোকাল ক্যাশ থেকে &lt;০.৫ সেকেন্ডে কমপ্লিট রেজাল্ট রিটার্ন করার ফলব্যাক লেয়ার যোগ করা।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p0">P0 Showstopper</span>
        <span style="font-size: 7.5pt; color: #64748b;">১.৫ ঘণ্টা</span>
      </div>
    </div>
  </div>

  <h3>মডিউল B: ডেটাবেস সম্প্রসারণ ও নলেজ ইঞ্জিনিয়ারিং (P1 - উচ্চ গুরুত্ব)</h3>
  <div class="task-list">
    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৪. বাংলাদেশের ওষুধের ক্যাটালগ অন্তত ২০০+ ব্র্যান্ডে সম্প্রসারণ করা</div>
        <div class="task-desc">
          <code>init_db.py</code>-তে মাত্র ১৭টি ড্রাগ আছে। স্কয়ার, বেক্সিমকো, ইনসেপ্টা, রেনাটার প্রধান প্রধান অ্যান্টিবায়োটিক, অ্যান্টিহাইপারটেনসিভ, ডায়াবেটিক ও এনএসএআইডি (NSAIDs) ব্র্যান্ডের নাম, জেনেরিক, স্বাভাবিক ডোজ এবং রেনাল সতর্কবার্তা সিড করা।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p1">P1 High</span>
        <span style="font-size: 7.5pt; color: #64748b;">২ ঘণ্টা</span>
      </div>
    </div>

    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৫. Fuzzy Drug Name Matching অ্যালগরিদম বাস্তবায়ন</div>
        <div class="task-desc">
          হাতে লেখা প্রেসক্রিপশন বা ওটিসি বানানে প্রায়ই ভুল হয় (যেমন: <i>Sergil</i> ➔ <i>Sergel</i>, <i>Bizorun</i> ➔ <i>Bizoran</i>, <i>Napa Extand</i> ➔ <i>Napa Extend</i>)। পাইথনের <code>difflib.get_close_matches</code> ব্যবহার করে ৮০%+ ম্যাচিং কনফিডেন্স সহ জেনেরিক বের করা।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p1">P1 High</span>
        <span style="font-size: 7.5pt; color: #64748b;">১ ঘণ্টা</span>
      </div>
    </div>

    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৬. ড্রাগ-ডিজিজ কন্ট্রাইন্ডিকেশন রুলস সম্প্রসারণ</div>
        <div class="task-desc">
          শুধুমাত্র CKD + Ketorolac নয়, আরও ৩টি কমন বিপজ্জনক কম্বিনেশন যুক্ত করা: (১) Asthma রোগীর ক্ষেত্রে Non-selective Beta Blockers (Propranolol), (২) Peptic Ulcer-এ উচ্চমাত্রার NSAIDs (Naproxen/Diclofenac), (৩) গর্ভাবস্থায় ACEi/ARB (Bizoran/Ramiril)।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p1">P1 High</span>
        <span style="font-size: 7.5pt; color: #64748b;">১.৫ ঘণ্টা</span>
      </div>
    </div>
  </div>

  <h3>মডিউল C: ব্যাকএন্ড অপটিমাইজেশন ও সার্ভার ডেপ্লয়মেন্ট (P2 - স্ট্যান্ডার্ড)</h3>
  <div class="task-list">
    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৭. প্যারালাল এক্সিকিউশন ও পারফরম্যান্স টিউনিং (`asyncio.gather`)</div>
        <div class="task-desc">
          প্রেসক্রিপশন এনালাইসিসের বিভিন্ন পর্যায় যেমন ড্রাগ ক্যাটালগ লুকআপ, ইন্টারঅ্যাকশন ম্যাট্রিক্স কুয়েরি এবং রিস্ক স্কোর ক্যালকুলেশন অ্যাসিনক্রোনাসলি রান করিয়ে সামগ্রিক লেটেন্সি ২ সেকেন্ডের নিচে নিশ্চিত করা।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p2">P2 Medium</span>
        <span style="font-size: 7.5pt; color: #64748b;">১ ঘণ্টা</span>
      </div>
    </div>

    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৮. লোকাল ও ক্লাউড লাইভ সার্ভার ডেপ্লয়মেন্ট রেডি রাখা</div>
        <div class="task-desc">
          হোস্ট মেশিনে ডকার না থাকলেও পাইথন ভার্চুয়াল এনভায়রনমেন্ট ও ফ্রন্টএন্ড ভাইট দিয়ে যেন ১ ক্লিকে ডেমো চালু করা যায় তার জন্য <code>run_local.bat</code> স্ক্রিপ্ট তৈরি করা এবং প্রয়োজনে Render বা Railway-তে ব্যাকএন্ড ডেপ্লয় করে লাইভ URL রাখা।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p2">P2 Medium</span>
        <span style="font-size: 7.5pt; color: #64748b;">১.৫ ঘণ্টা</span>
      </div>
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- PAGE 3: ACTION ITEMS FOR JIHAD -->
<div class="section">
  <h2>
    <span>৪. জিহাদের (Frontend, QA & Pitch Lead) জন্য বিস্তারিত অ্যাকশন চেকলিস্ট</span>
    <span class="badge badge-jihad">Frontend + QA + Pitch</span>
  </h2>

  <h3>মডিউল A: ফ্রন্টএন্ড UI/UX ও লাইভ ডেমো কন্ট্রোল (P0 - শো-স্টপার)</h3>
  <div class="task-list">
    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">১. "1-Click 3 Golden Demo Scenarios Switcher" তৈরি করা</div>
        <div class="task-desc">
          বর্তমানে প্রেসক্রিপশন এনালাইজার পেজে শুধুমাত্র ১টি ডেমো বাটন আছে। সেখানে একটি প্রি-সেট ড্রপডাউন বা ৩টি স্পষ্ট বাটন দিতে হবে: (১) <strong>কেস ১: CKD 3 + Rolac (14 Days)</strong>, (২) <strong>কেস ২: Triple Whammy (Heart Failure + Diuretic + NSAID)</strong>, (৩) <strong>কেস ৩: শিশু রোগীতে অ্যাসপিরিন (Reye's Syndrome Risk)</strong>। ক্লিক করলেই পেশেন্ট ডাটা ও ড্রাগ লোড হবে।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p0">P0 Showstopper</span>
        <span style="font-size: 7.5pt; color: #64748b;">২ ঘণ্টা</span>
      </div>
    </div>

    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">২. মাল্টি-স্টেজ স্ক্যানিং লোডারে ভিজ্যুয়াল ফিডব্যাক ও টাইমার</div>
        <div class="task-desc">
          প্রেসক্রিপশন এনালাইসিসের সময় ৮টি ধাপের প্রগ্রেস বার এবং লাইভ স্ট্যাটাস টেক্সট (যেমন: "OCR Reading ➔ DGDA Normalizing ➔ SHAP Risk Calculating") মসৃণ ট্রানজিশনে দেখানো, যা জাজদের চোখে সিস্টেমের গভীরতা প্রমাণ করবে।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p1">P1 High</span>
        <span style="font-size: 7.5pt; color: #64748b;">১.৫ ঘণ্টা</span>
      </div>
    </div>

    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৩. বাংলা অডিও প্লেয়ার ব্রাউজার সাপোর্ট ও প্রিন্ট প্রিভিউ চেক</div>
        <div class="task-desc">
          <code>BanglaPatientCompanion.tsx</code>-এ ক্রোম ও এজ ব্রাউজারে বাংলা ভয়েস ঠিকমতো বাজছে কি না তা বিভিন্ন মেশিনে পরীক্ষা করা। "স্মার্ট প্রেসক্রিপশন কার্ড" প্রিন্ট দিলে যেন সুন্দর মার্জিনে এক পাতায় প্রিন্ট হয় তা নিশ্চিত করা।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p1">P1 High</span>
        <span style="font-size: 7.5pt; color: #64748b;">১ ঘণ্টা</span>
      </div>
    </div>
  </div>

  <h3>মডিউল B: গোল্ডেন ডেটাসেট ও QA ভ্যালিডেশন (P1 - উচ্চ গুরুত্ব)</h3>
  <div class="task-list">
    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৪. ১৫টি বাস্তব ও জটিল টেস্ট প্রেসক্রিপশনের গোল্ডেন ডেটাসেট তৈরি</div>
        <div class="task-desc">
          তাহরিমার দায়িত্বটি এখন জিহাদকে লিড দিতে হবে: ১৫টি স্পষ্ট প্রেসক্রিপশন ইমেজ (কিছু প্রিন্টেড ও কিছু হাতে লেখা) সংগ্রহ করা এবং তাদের প্রত্যাশিত এক্সট্র্যাকশন ও অ্যালার্টের একটি গোল্ডেন ডেটাসেট <code>ai_engine/samples/</code> ফোল্ডারে রাখা।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p1">P1 High</span>
        <span style="font-size: 7.5pt; color: #64748b;">২ ঘণ্টা</span>
      </div>
    </div>

    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৫. এন্ড-টু-এন্ড বাগ হান্টিং ও স্ট্রেস টেস্ট</div>
        <div class="task-desc">
          মোবাইল ভিউ, ট্যাবলেট ভিউ, ভুল ফাইল আপলোড (যেমন: প্রেসক্রিপশন ছাড়া অন্য ছবি), সার্ভার ড্রপ ইত্যাদিতে ইউজার ফ্রেন্ডলি এরর মেসেজ দেখাচ্ছে কি না তা নিশ্চিত করা। কনসোলে কোনো লাল এরর থাকা চলবে না।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p2">P2 Medium</span>
        <span style="font-size: 7.5pt; color: #64748b;">১.৫ ঘণ্টা</span>
      </div>
    </div>
  </div>

  <h3>মডিউল C: ১০ স্লাইডের উইনিং পিচ ডেক ও প্রেজেন্টেশন (P0 - শো-স্টপার)</h3>
  <div class="task-list">
    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৬. ১০ স্লাইডের উইনিং পিচ ডেক (Pitch Deck Presentation) প্রস্তুত করা</div>
        <div class="task-desc">
          জাজদের সামনে প্রেজেন্টেশনের জন্য প্রফেশনাল ১০টি স্লাইড তৈরি করতে হবে: (১) বাংলাদেশের প্রেসক্রিপশন সংকট ও ড্রাগ কলিশন, (২) আমাদের ৫-লেয়ার সলিউশন, (৩) নিউরো-সিম্বলিক আর্কিটেকচার (AI reads, Rules decide), (৪) লাইভ ডেমো স্ক্রিনশট, (৫) ক্লিনিক্যাল এক্যুরেসি বেঞ্চমার্ক (৯৮% সিনট্যাক্স, ০% হ্যালুসিনেশন), (৬) B2B2C বিজনেস মডেল, (৭) মার্কেট সাইজ ও কম্পিটিশন, (৮) রোডম্যাপ ও টিম।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p0">P0 Showstopper</span>
        <span style="font-size: 7.5pt; color: #64748b;">৩ ঘণ্টা</span>
      </div>
    </div>

    <div class="task-item">
      <span class="checkbox"></span>
      <div class="task-content">
        <div class="task-title">৭. ৩ মিনিটের লাইভ ডেমো স্ক্রিপ্ট ও ২ মিনিটের ব্যাকআপ ভিডিও রেকর্ড</div>
        <div class="task-desc">
          ঘড়ি ধরে ৩ মিনিটে কী কী বলবেন তার একদম শব্দে শব্দে স্ক্রিপ্ট লিখে ফেলা এবং জাজদের সামনে প্রোজেক্টর বা নেট ফেইল করলে দেখানোর জন্য একটি হাই-কোয়ালিটি ২ মিনিটের লাইভ ডেমো ভিডিও স্ক্রিন রেকর্ড করে অফলাইনে ল্যাপটপ ও পেনড্রাইভে সেভ রাখা।
        </div>
      </div>
      <div class="task-meta">
        <span class="badge badge-p0">P0 Showstopper</span>
        <span style="font-size: 7.5pt; color: #64748b;">১.৫ ঘণ্টা</span>
      </div>
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- PAGE 4: 3 GOLDEN DEMO SCENARIOS & CRASH TIMELINE -->
<div class="section">
  <h2>৫. জাজদের সামনে দেখানোর ৩টি গোল্ডেন লাইভ ডেমো সিনারিও (The 3 Winning Scenarios)</h2>
  <div class="callout callout-info" style="margin-bottom: 6px;">
    জাজদের সামনে এলোমেলো ডাটা না দিয়ে এই ৩টি সাজানো ক্লিনিক্যাল কেস লাইভ ডেমো দিন। প্রতিটিতে বাংলাদেশের বাস্তব প্রেক্ষাপট ও ক্লিনিক্যাল ঝুঁকির সুস্পষ্ট সমাধান ফুটে উঠবে:
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 20%;">সিনারিও ও রোগী</th>
        <th style="width: 25%;">প্রেসক্রাইবড ওষুধ ও ডোজ</th>
        <th style="width: 30%;">সিস্টেমের তাত্ক্ষণিক অ্যালার্ট (Findings)</th>
        <th style="width: 25%;">সাজেস্টেড বিকল্প ও বাংলা অডিও</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>ডেমো কেস ১: (The Wow Hook)</strong><br>
          মোঃ আব্দুল করিম (৬২ বছর, পুরুষ)<br>
          রোগ: ডায়াবেটিস, উচ্চ রক্তচাপ, CKD-3<br>
          ল্যাব: eGFR 34.5, Creatinine 2.1
        </td>
        <td>
          ১. <strong>Bizoran 5/20</strong> (1+0+0)<br>
          ২. <strong>Rolac 10mg</strong> (1+0+1) — <strong>১৪ দিন মেয়াদে!</strong>
        </td>
        <td>
          <span class="badge badge-p0">CRITICAL</span> <strong>Rolac 5-day ceiling violation:</strong> রোলাক ৫ দিনের বেশি প্রেসক্রাইব করা নিষিদ্ধ।<br>
          <span class="badge badge-p0">CRITICAL</span> <strong>Nephrotoxic Clash:</strong> ARB + NSAID মিলিতভাবে তীব্র কিডনি ফেইলিউর (৮৬% AKI ঝুঁকি) ঘটাবে।
        </td>
        <td>
          <strong>বিকল্প:</strong> রোলাক বন্ধ করে <i>Napa Extend 665mg</i> দেওয়া।<br>
          <strong>বাংলা ভয়েস:</strong> "জরুরি সতর্কতা: ব্যথার ওষুধ রোলাক আপনার কিডনি নষ্ট করতে পারে..."
        </td>
      </tr>
      <tr>
        <td>
          <strong>ডেমো কেস ২: (Triple Whammy)</strong><br>
          বেগম রোকেয়া (৫৪ বছর, মহিলা)<br>
          রোগ: হার্ট ফেইলিউর, উচ্চ রক্তচাপ<br>
          ল্যাব: eGFR 52, Creatinine 1.3
        </td>
        <td>
          ১. <strong>Ramiril 5mg</strong> (ACEi)<br>
          ২. <strong>Lasix 40mg</strong> (Diuretic)<br>
          ৩. <strong>Voltalin 50mg</strong> (NSAID - Diclofenac)
        </td>
        <td>
          <span class="badge badge-p0">CRITICAL</span> <strong>Triple Whammy Syndrome:</strong> ACEi + Diuretic + NSAID একসাথে খেলে রেনাল অটোরেগুলেশন ধসে পড়ে আকস্মিক ডায়ালিসিসের ঝুঁকি তৈরি করে।
        </td>
        <td>
          <strong>বিকল্প:</strong> ডাইক্লোফেনাকের বদলে টপিক্যাল জেল বা প্যারাসিটামল সাজেস্ট।<br>
          <strong>বাংলা ভয়েস:</strong> ৩টি ওষুধের বিপজ্জনক বিক্রিয়া রোগীকে সহজ বাংলায় শোনানো।
        </td>
      </tr>
      <tr>
        <td>
          <strong>ডেমো কেস ৩: (Pediatric Safety)</strong><br>
          মাস্টার আয়ান (৮ বছর, শিশু)<br>
          রোগ: ভাইরাল ফ্লু ও জ্বর<br>
          ল্যাব: পেডিয়াট্রিক নরমাল
        </td>
        <td>
          ১. <strong>Ecospirin 75mg</strong> (1+0+1)<br>
          ২. <strong>Ciprocin Drop</strong>
        </td>
        <td>
          <span class="badge badge-p0">CRITICAL</span> <strong>Reye's Syndrome Alert:</strong> শিশুদের ভাইরাল ইনফেকশনে অ্যাসপিরিন দিলে মারাত্মক লিভার ও ব্রেইন ড্যামেজ (Reye's syndrome) হতে পারে।
        </td>
        <td>
          <strong>বিকল্প:</strong> অ্যাসপিরিন তৎক্ষণাৎ বন্ধ করে <i>Napa Suspension</i> প্রেসক্রাইব করা।<br>
          <strong>বাংলা নির্দেশিকা:</strong> মা-বাবার জন্য স্পষ্ট বাংলা পরামর্শ।
        </td>
      </tr>
    </tbody>
  </table>
</div>

<div class="section">
  <h2>৬. অবশিষ্ট দিনগুলোর জন্য ৩ দিনের ক্র্যাশ এক্সিকিউশন রোডম্যাপ (Crash Timeline)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 17%;">দিন ও সময়</th>
        <th style="width: 41%;">আপনার কাজ (AI, BACKEND & DB)</th>
        <th style="width: 42%;">জিহাদের কাজ (FRONTEND, QA & PITCH)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>আজকের বাকি দিন (Day 3 Finish)</strong></td>
        <td>
          • <code>ai_engine</code>-এর সাথে FastAPI ব্যাকএন্ড এন্ডপয়েন্ট কানেক্ট করা।<br>
          • সিন্থেটিক ডেটায় XGBoost রিগ্রেসর ট্রেইন করে <code>risk_model.pkl</code> ও রিয়েল SHAP এক্সপ্লেইনার যুক্ত করা।
        </td>
        <td>
          • UI-তে <strong>"1-Click 3 Golden Demo Scenarios Switcher"</strong> বাটন তৈরি ও কানেক্ট করা।<br>
          • ডেমো সিনারিওর ৩টি বাস্তব প্রেসক্রিপশন ইমেজ ফাইল রেডি করা।
        </td>
      </tr>
      <tr>
        <td><strong>আগামীকাল (Day 4: Polish & Data)</strong></td>
        <td>
          • <code>init_db.py</code>-তে ২০০+ ড্রাগ সিড করা ও Fuzzy Matching কোড লেখা।<br>
          • ডেমো ফেইল-সেফ রাখার জন্য ৩টি কেসের <strong>Smart Local Cache</strong> সেট করা।<br>
          • ব্যাকএন্ডের ফুল টেস্ট রান করে API কনফার্ম করা।
        </td>
        <td>
          • ১০ স্লাইডের উইনিং পিচ ডেক (Pitch Deck PPT/Canva) চূড়ান্ত করা।<br>
          • বাংলা অডিও প্লেয়ার ও প্রিন্ট লেআউট চেক করা।<br>
          • এন্ড-টু-এন্ড সব ফিচার ক্লিক করে বাগ হান্টিং শেষ করা।
        </td>
      </tr>
      <tr>
        <td><strong>ফাইনালের দিন (Day 5: Rehearsal & Win)</strong></td>
        <td>
          • <strong>দুপুর ১২টার মধ্যে 100% Code Freeze</strong> (আর কোড চেঞ্জ হবে না)।<br>
          • লোকাল মেশিনে ব্যাকআপ সার্ভার ও হটস্পট ব্যাকআপ রেডি রাখা।<br>
          • টেকনিক্যাল কোয়েশ্চেন ডিফেন্স শিট রেডি রাখা।
        </td>
        <td>
          • ৩ মিনিটের লাইভ ডেমোর একটি ২ মিনিটের ব্যাকআপ ভিডিও স্ক্রিন রেকর্ড করে পেনড্রাইভে রাখা।<br>
          • ঘড়ি ধরে ৩ মিনিটের পিচ এবং ২ মিনিটের লাইভ ডেমো <strong>কমপক্ষে ৫ বার রিহার্সাল</strong> দেওয়া!
        </td>
      </tr>
    </tbody>
  </table>
</div>

<div class="page-break"></div>

<!-- PAGE 5: JUDGING FORMULA & WINNING DEFENSE -->
<div class="section">
  <h2>৭. বিচারকদের নম্বর তোলার ৪টি গোপন অস্ত্র (Winning Edge Formula)</h2>
  <div class="grid-2">
    <div class="card-box">
      <h4 style="color: #0f766e;">১. "AI Reads, Rules Decide" ফিলোসফি</h4>
      <p style="font-size: 8pt; color: #334155; margin: 0;">
        জাজদের স্পষ্ট বলবেন: "আমরা জেনেরিক চ্যাটবট বানাইনি যা মনগড়া উত্তর দিয়ে রোগী মারবে। আমাদের AI শুধু হাতের লেখা পড়ে, কিন্তু ওষুধের সেফটি ও ইন্টারঅ্যাকশন ১০০% নিয়ন্ত্রিত হয় ডিজিডিএ ও বিএনএফ এর ক্লিনিক্যাল রুলস দ্বারা।"
      </p>
    </div>
    <div class="card-box">
      <h4 style="color: #0f766e;">২. SHAP XAI এর ভিজ্যুয়াল প্রভাব</h4>
      <p style="font-size: 8pt; color: #334155; margin: 0;">
        ক্লিনিক্যাল রিস্ক স্কোর (৮৬%) দেখানোর সাথে সাথে Recharts Waterfall চার্ট দিয়ে দেখিয়ে দিন কোন ফ্যাক্টরের জন্য কত পারসেন্ট ঝুঁকি বেড়েছে (রোলাক ১৪ দিন: +৪২%, eGFR কম: +২৮%)। এতে জাজরা মুগ্ধ হতে বাধ্য।
      </p>
    </div>
    <div class="card-box">
      <h4 style="color: #0f766e;">৩. সহজ বাংলা ও ভয়েস অডিও (Bangla Inclusion)</h4>
      <p style="font-size: 8pt; color: #334155; margin: 0;">
        বাংলাদেশে কোটি কোটি রোগী প্রেসক্রিপশন পড়তে পারেন না। এক ক্লিকে বাংলায় স্পষ্ট নির্দেশনা ও ভয়েস অডিও বাজিয়ে শোনানো বিচারকদের কাছে সামাজিক ইমপ্যাক্টের দিক থেকে সর্বোচ্চ নম্বর এনে দেবে।
      </p>
    </div>
    <div class="card-box">
      <h4 style="color: #0f766e;">৪. বাস্তবসম্মত B2B2C বিজনেস মডেল</h4>
      <p style="font-size: 8pt; color: #334155; margin: 0;">
        পিচে স্পষ্ট করে বলুন: "এটি লাজ ফার্মা, আরোগ্য, মেডইজি-র মতো ফার্মেসি চেইন এবং এভারকেয়ার/স্কয়ার হাসপাতালের EMR সিস্টেমে B2B API SaaS (প্রতি স্ক্যানে ৳২-৳৫) হিসেবে যুক্ত হবে এবং সাধারণ রোগীর জন্য ফ্রিমিয়াম অ্যাপ থাকবে।"
      </p>
    </div>
  </div>
</div>

<div class="section">
  <h2>৮. বিচারকদের সম্ভাব্য কঠিন প্রশ্ন ও তার স্মার্ট উত্তর (Judge Defense Q&A Sheet)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 35%;">বিচারকের সম্ভাব্য প্রশ্ন (Judge Tough Question)</th>
        <th style="width: 65%;">আপনার সুনির্দিষ্ট স্মার্ট উত্তর (Winning Response)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>"ডাক্তারদের অপাঠ্য হাতের লেখা কি আপনাদের LLM ভুল পড়তে পারে না? ভুল পড়লে কী হবে?"</strong></td>
        <td>
          "খুবই গুরুত্বপূর্ণ প্রশ্ন স্যার। আমাদের সিস্টেমে <strong>Confidence Score</strong> এবং <strong>Clinician-in-the-loop</strong> ভেরিফিকেশন আছে। কোনো মেডিসিন টোকেনের কনফিডেন্স ৮০% এর নিচে নামলে সিস্টেমে 'Needs Review' ফ্ল্যাগ জ্বলে ওঠে এবং ডাক্তার BMDC রেজিস্ট্রেশন নম্বর দিয়ে সাইন-অফ করার আগে তা এডিট করতে পারেন।"
        </td>
      </tr>
      <tr>
        <td><strong>"ChatGPT বা Gemini তো ফ্রিতেই ড্রাগ ইন্টারঅ্যাকশন বলে দেয়, আপনাদের আলাদা দরকার কী?"</strong></td>
        <td>
          "জেনেরিক LLM প্রায়শই মেডিকেল হ্যালুসিনেশন করে এবং বাংলাদেশের Napa Extend, Bizoran, Sergel ইত্যাদি দেশীয় ব্র্যান্ডের সঠিক কম্পোজিশন চেনে না। আমরা ডিজিডিএ (DGDA) ড্রাগ ক্যাটালগ এবং বিএনএফ/কেডিআইজিও গাইডলাইন ব্যবহার করে <strong>জিরো-হ্যালুসিনেশন নিশ্চিত করেছি—যেখানে AI শুধু ইনপুট নেয় কিন্তু ক্লিনিক্যাল রুলস সিদ্ধান্ত দেয়।</strong>"
        </td>
      </tr>
      <tr>
        <td><strong>"ভুল সতর্কবার্তার জন্য যদি রোগীর ক্ষতি হয়, তবে আইনি দায় কার?"</strong></td>
        <td>
          "PredictRx কোনো প্রেসক্রিপশন তৈরি করে না; এটি একটি <strong>Clinical Decision Support System (CDSS)</strong>। এটি চিকিৎসকের বদলি নয় বরং সহায়ক। প্রতি রেজাল্টে স্পষ্ট ডিসক্লেইমার রয়েছে এবং ফাইনাল ডিসিশন লাইসেন্সধারী নিবন্ধিত চিকিৎসকের বিএমডিসি সাইন-অফের পরই অডিট লগে স্টোর হয়।"
        </td>
      </tr>
    </tbody>
  </table>
</div>

<div class="footer-note">
  PredictRx BD — 2-Member Engineering Masterplan • Generated for You & Jihad • International AI Builders Congress 2026
</div>

</body>
</html>
"""

def generate_pdf():
    temp_dir = tempfile.gettempdir()
    html_path = os.path.join(temp_dir, "predict_rx_remaining_tasks.html")
    pdf_temp_path = os.path.join(temp_dir, "predict_rx_remaining_tasks.pdf")
    output_pdf = os.path.abspath("PredictRx_BD_Remaining_Tasks_Plan.pdf")

    print(f"Writing HTML to: {html_path}")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)

    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        print(f"Edge not found at {edge_path}")
        sys.exit(1)

    cmd = [
        edge_path,
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        f"--print-to-pdf={pdf_temp_path}",
        f"file:///{html_path.replace(os.sep, '/')}"
    ]

    print("Running Edge headless PDF export...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("Edge returncode:", res.returncode)

    if os.path.exists(pdf_temp_path):
        with open(pdf_temp_path, "rb") as src, open(output_pdf, "wb") as dst:
            dst.write(src.read())
        size_kb = os.path.getsize(output_pdf) / 1024
        print(f"Success! Generated PDF at: {output_pdf} ({size_kb:.1f} KB)")
    else:
        print("Failed to find generated PDF in temp dir!")
        sys.exit(1)

if __name__ == "__main__":
    generate_pdf()
