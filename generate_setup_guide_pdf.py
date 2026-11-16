import os
import subprocess
import sys
import shutil

HTML_SETUP_GUIDE = """<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>PredictRx BD — Complete Setup, Execution & Testing Runbook</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

  @page {
    size: A4 portrait;
    margin: 10mm 12mm 12mm 12mm;
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8pt;
      font-family: 'JetBrains Mono', monospace;
      color: #64748b;
    }
    @bottom-left {
      content: "PredictRx BD • Setup, Run & Testing Master Guide";
      font-size: 8pt;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #64748b;
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Plus Jakarta Sans', 'Segoe UI', 'Nirmala UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 9.5pt;
    line-height: 1.5;
  }

  .header {
    background: linear-gradient(135deg, #070b14 0%, #0f172a 100%);
    color: #ffffff;
    padding: 18px 22px;
    border-radius: 8px;
    margin-bottom: 16px;
    border-left: 5px solid #06b6d4;
  }
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .header-badge {
    background: rgba(6, 182, 212, 0.2);
    border: 1px solid #06b6d4;
    color: #38bdf8;
    font-size: 7.5pt;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .header-date {
    font-size: 8pt;
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
  }
  .header-title {
    font-size: 18pt;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  .header-subtitle {
    font-size: 9.5pt;
    color: #94a3b8;
    line-height: 1.4;
  }

  .section {
    margin-bottom: 14px;
  }
  .section-title {
    font-size: 12pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 4px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title .step-badge {
    background: #0284c7;
    color: #ffffff;
    font-size: 8pt;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 4px;
  }

  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 10px;
  }

  .code-box {
    background: #090d18;
    color: #f1f5f9;
    border: 1px solid #1e293b;
    border-radius: 6px;
    padding: 8px 12px;
    margin: 6px 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    line-height: 1.45;
    position: relative;
    overflow-x: hidden;
  }
  .code-box .comment {
    color: #64748b;
    font-style: italic;
  }
  .code-box .cmd {
    color: #38bdf8;
    font-weight: 600;
  }
  .code-box .highlight {
    color: #34d399;
  }

  .callout {
    border-left: 4px solid #0284c7;
    background: #f0f9ff;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    font-size: 8.5pt;
    margin: 8px 0;
  }
  .callout-success {
    border-left-color: #10b981;
    background: #ecfdf5;
  }
  .callout-warning {
    border-left-color: #f59e0b;
    background: #fffbeb;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin: 8px 0;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    text-align: left;
  }
  th {
    background: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
  }

  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 700;
  }
  .badge-p0 { background: #fee2e2; color: #991b1b; }
  .badge-p1 { background: #fef3c7; color: #92400e; }
  .badge-p2 { background: #dcfce7; color: #166534; }
  .badge-cyan { background: #cffafe; color: #155e75; }

  .page-break {
    page-break-after: always;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
</style>
</head>
<body>

  <!-- ================= PAGE 1: PREREQUISITES & CLONE ================= -->
  <div class="header">
    <div class="header-top">
      <span class="header-badge">ENGINEERING EXECUTION RUNBOOK</span>
      <span class="header-date">International AI Builders Congress 2026</span>
    </div>
    <h1 class="header-title">PredictRx BD: Complete Setup, Run & Testing Guide</h1>
    <p class="header-subtitle">
      গিটহাব থেকে ক্লোন করা থেকে শুরু করে লোকাল ডাটাবেস, ব্যাকএন্ড, ফ্রন্টএন্ড চালানো, ৩টি গোল্ডেন সিনারিও ডেমো দেওয়া এবং ৬৯টি স্বয়ংক্রিয় টেস্ট রান করার সম্পূর্ণ ও নির্ভুল স্টেপ-বাই-স্টেপ গাইডলাইন।
    </p>
  </div>

  <div class="section">
    <h2 class="section-title">
      <span class="step-badge">ধাপ ০</span> সিস্টেম রিকোয়ারমেন্টস ও প্রাক-প্রস্তুতি (Prerequisites)
    </h2>
    <div class="card">
      <p style="font-size: 9pt; margin-bottom: 6px;">প্রজেক্টটি নিজের মেশিনে প্রথমবার সেটআপ করার পূর্বে নিচের সফটওয়্যারগুলো ইনস্টল করা আছে কি না যাচাই করে নিন:</p>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">সফটওয়্যার</th>
            <th style="width: 25%;">প্রয়োজনীয় ভার্সন</th>
            <th style="width: 50%;">চেক করার টার্মিনাল কমান্ড</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Git</strong></td>
            <td>v2.30+</td>
            <td><code>git --version</code></td>
          </tr>
          <tr>
            <td><strong>Python</strong></td>
            <td>Python 3.10, 3.11, 3.12 বা 3.14</td>
            <td><code>python --version</code></td>
          </tr>
          <tr>
            <td><strong>Node.js & npm</strong></td>
            <td>Node v18+ বা v20+ (npm v9+)</td>
            <td><code>node -v</code> এবং <code>npm -v</code></td>
          </tr>
          <tr>
            <td><strong>Microsoft Edge / Chrome</strong></td>
            <td>যেকোনো লেটেস্ট ব্রাউজার</td>
            <td>Web Speech API বাংলা অডিও ও PDF এক্সপোর্টের জন্য</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">
      <span class="step-badge">ধাপ ১</span> গিটহাব থেকে প্রজেক্ট ক্লোন ও ব্রাঞ্চ চেকআউট (Git Clone & Branch)
    </h2>
    <div class="card">
      <p style="font-size: 8.8pt; margin-bottom: 4px;">আপনার টার্মিনাল (PowerShell / Command Prompt / Bash) ওপেন করে আপনার পছন্দের ফোল্ডারে নিচের কমান্ডগুলো চালান:</p>
      
      <div class="code-box">
        <span class="comment"># ১. রিপোজিটরি ক্লোন করুন</span><br>
        <span class="cmd">git clone</span> https://github.com/tofayel98bd/PredictRx-AI.git<br><br>
        <span class="comment"># ২. প্রজেক্ট ডিরেক্টরিতে প্রবেশ করুন</span><br>
        <span class="cmd">cd</span> PredictRx-AI<br><br>
        <span class="comment"># ৩. লেটেস্ট কোড থাকা develop অথবা feature/ai-rag-engine ব্রাঞ্চে সুইচ করুন</span><br>
        <span class="cmd">git checkout</span> develop<br>
        <span class="cmd">git pull origin</span> develop
      </div>

      <div class="callout callout-success">
        <strong>💡 প্রো-টিপ:</strong> আমাদের সমস্ত লেটেস্ট ফিচার, ১০ স্লাইডের পিচ ডেক, ৩টি গোল্ডেন সিনারিও এবং ৬৯টি টেস্ট <code>develop</code> এবং <code>feature/ai-rag-engine</code> ব্রাঞ্চে পুশ করা আছে।
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">
      <span class="step-badge">ধাপ ২</span> পাইথন ভার্চুয়াল এনভায়রনমেন্ট ও ডিপেনডেন্সি সেটআপ (Backend Setup)
    </h2>
    <div class="card">
      <p style="font-size: 8.8pt; margin-bottom: 4px;">ব্যাকএন্ড ও এআই ইঞ্জিনের জন্য পাইথন ভার্চুয়াল এনভায়রনমেন্ট তৈরি করে প্যাকেজ ইনস্টল করুন:</p>

      <div class="code-box">
        <span class="comment"># ১. ভার্চুয়াল এনভায়রনমেন্ট তৈরি করুন (.venv)</span><br>
        <span class="cmd">python -m venv</span> .venv<br><br>
        <span class="comment"># ২. ভার্চুয়াল এনভায়রনমেন্ট এক্টিভেট করুন (Windows PowerShell)</span><br>
        <span class="cmd">.\.venv\Scripts\Activate.ps1</span><br>
        <span class="comment"># (অথবা Git Bash ব্যবহার করলে: source .venv/Scripts/activate)</span><br><br>
        <span class="comment"># ৩. ব্যাকএন্ডের ডিপেনডেন্সি ইনস্টল করুন</span><br>
        <span class="cmd">pip install -r</span> backend/requirements.txt
      </div>

      <div class="callout">
        <strong>🛡️ জিরো-কনফিগ ডাটাবেস ফেইলসেফ:</strong> প্রজেক্টটিতে স্বয়ংক্রিয় SQLite ফলব্যাক বিল্ট-ইন করা আছে। PostgreSQL না থাকলেও এটি সরাসরি <code>backend/predictrx.db</code> ব্যবহার করে তাৎক্ষণিকভাবে চালু হয়ে যাবে, যেখানে ২৬০+ জেনুইন ডিজিডিএ ওষুধ ও ইন্টারঅ্যাকশন আগে থেকেই সিড করা আছে!
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ================= PAGE 2: RUNNING BACKEND & FRONTEND ================= -->
  <div class="header" style="padding: 12px 18px; margin-bottom: 12px;">
    <h1 class="header-title" style="font-size: 14pt;">ধাপ ৩ ও ৪: ব্যাকএন্ড ও ফ্রন্টএন্ড সার্ভার চালু করা</h1>
  </div>

  <div class="section">
    <h2 class="section-title">
      <span class="step-badge">ধাপ ৩</span> FastAPI ব্যাকএন্ড সার্ভার চালু করা (Run Backend)
    </h2>
    <div class="card">
      <p style="font-size: 8.8pt; margin-bottom: 4px;">ভার্চুয়াল এনভায়রনমেন্ট এক্টিভেটেড থাকা অবস্থায় <strong>টার্মিনাল ১</strong>-এ নিচের কমান্ডটি চালান:</p>
      
      <div class="code-box">
        <span class="comment"># ব্যাকএন্ড ফোল্ডারে যান এবং Uvicorn সার্ভার চালু করুন</span><br>
        <span class="cmd">cd</span> backend<br>
        <span class="cmd">python -m uvicorn</span> app.main:app --host 127.0.0.1 --port 8000 --reload
      </div>

      <p style="font-size: 8.5pt; margin-top: 6px;">সার্ভার সফলভাবে চালু হলে টার্মিনালে নিচের মতো মেসেজ আসবে:</p>
      <div class="code-box" style="background: #022c22; border-color: #059669; color: #a7f3d0;">
        INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)<br>
        INFO:     PostgreSQL unavailable... Falling back to local SQLite engine: predictrx.db<br>
        INFO:     Application startup complete.
      </div>

      <p style="font-size: 8.5pt; margin-top: 6px;"><strong>ব্রাউজারে ব্যাকএন্ড ভেরিফিকেশন:</strong></p>
      <ul style="padding-left: 20px; font-size: 8.5pt; color: #334155;">
        <li>Health Status: <a href="http://localhost:8000/health" target="_blank">http://localhost:8000/health</a> ➔ <code>{"status":"healthy"}</code></li>
        <li>Swagger Interactive API Docs: <a href="http://localhost:8000/docs" target="_blank">http://localhost:8000/docs</a> (২১টি এন্ডপয়েন্ট রেডি)</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">
      <span class="step-badge">ধাপ ৪</span> React 19 ফ্রন্টএন্ড সার্ভার চালু করা (Run Frontend)
    </h2>
    <div class="card">
      <p style="font-size: 8.8pt; margin-bottom: 4px;">একটি নতুন <strong>টার্মিনাল ২</strong> ওপেন করে প্রজেক্টের রুট ডিরেক্টরি থেকে ফ্রন্টএন্ড ফোল্ডারে যান:</p>

      <div class="code-box">
        <span class="comment"># ১. ফ্রন্টএন্ড ডিরেক্টরিতে যান</span><br>
        <span class="cmd">cd</span> frontend<br><br>
        <span class="comment"># ২. নোড প্যাকেজগুলো ইনস্টল করুন</span><br>
        <span class="cmd">npm install</span><br><br>
        <span class="comment"># ৩. Vite ডেভ সার্ভার চালু করুন</span><br>
        <span class="cmd">npm run dev</span>
      </div>

      <p style="font-size: 8.5pt; margin-top: 6px;">টার্মিনালে লোকাল ইউআরএল প্রদর্শিত হবে:</p>
      <div class="code-box" style="background: #082f49; border-color: #0284c7; color: #bae6fd;">
        VITE v8.3.8  ready in 320 ms<br>
        ➜  Local:   http://localhost:5173/<br>
        ➜  Network: use --host to expose
      </div>

      <div class="callout callout-success">
        <strong>🌐 অ্যাপে প্রবেশ করুন:</strong> আপনার ব্রাউজারে <strong><code>http://localhost:5173</code></strong> ওপেন করলেই ড্যাশবোর্ড লোড হবে!
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">
      <span class="step-badge">ধাপ ৫</span> জাজদের সামনে ৩টি গোল্ডেন সিনারিও ডেমো দেওয়া (Live Demo Protocol)
    </h2>
    <div class="card">
      <p style="font-size: 8.8pt; margin-bottom: 6px;">ব্রাউজারে <code>http://localhost:5173/analyze</code> অথবা সাইডবারের <strong>"Analyze Prescription"</strong>-এ ক্লিক করুন। পেজের শীর্ষে <strong>১-ক্লিক ৩টি গোল্ডেন সিনারিও কার্ড</strong> দেখতে পাবেন:</p>

      <table>
        <thead>
          <tr>
            <th style="width: 20%;">সিনারিও</th>
            <th style="width: 25%;">রোগী ও ওষুধ</th>
            <th style="width: 35%;">সিস্টেমের তাত্ক্ষণিক অ্যালার্ট (Findings)</th>
            <th style="width: 20%;">ডেমো বাটন</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>কেস ১ (The Hook)</strong></td>
            <td>মোঃ আব্দুল করিম (৬২M, CKD-3)<br>Bizoran 5/20 + Rolac 10 (14 দিন)</td>
            <td><span class="badge badge-p0">CRITICAL 86%</span> রোলাকের ৫ দিনের সিলিং ভঙ্গ + কিডনি বিকল (AKI) ঝুঁকি।</td>
            <td><strong>Instant Run</strong> ক্লিক করুন (<১৫ms রেসপন্স)</td>
          </tr>
          <tr>
            <td><strong>কেস ২ (Triple Whammy)</strong></td>
            <td>বেগম রোকেয়া (৫৪F, হার্ট ফেইলিউর)<br>Angilock + Lasix + Rolac</td>
            <td><span class="badge badge-p0">CRITICAL 78%</span> ট্রিপল হুয়ামি: কিডনির গ্লোমেরুলার প্রেশার শূন্যে নেমে যাওয়া।</td>
            <td><strong>Instant Run</strong> ক্লিক করুন</td>
          </tr>
          <tr>
            <td><strong>কেস ৩ (Pediatric)</strong></td>
            <td>মাস্টার আয়ান (৭M, ভাইরাল জ্বর)<br>Ecosprin (Aspirin) 75mg</td>
            <td><span class="badge badge-p0">CRITICAL 84%</span> শিশুদের ভাইরাল জ্বরে অ্যাসপিরিন নিষিদ্ধ (Reye's সিন্ড্রোম)।</td>
            <td><strong>Instant Run</strong> ক্লিক করুন</td>
          </tr>
        </tbody>
      </table>

      <div class="grid-2" style="margin-top: 8px;">
        <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 4px; font-size: 8pt;">
          <strong>🔊 বাংলা ভয়েস টেস্ট:</strong> স্ক্রল করে নিচে "সহজ বাংলা রোগী নির্দেশিকা" কার্ডে গিয়ে <strong>"শব্দে শুনুন (Listen)"</strong> বাটনে ক্লিক করলেই খাঁটি বাংলায় অডিও বাজবে।
        </div>
        <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 4px; font-size: 8pt;">
          <strong>📑 স্লাইড ডেক ওপেন:</strong> সাইডবারে থাকা <strong>"Pitch Deck (10-Slide)"</strong> বাটনে ক্লিক করলেই নতুন ট্যাবে ফুলস্ক্রিন প্রেজেন্টেশন চালু হবে।
        </div>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ================= PAGE 3: AUTOMATED TESTING & DOCKER ================= -->
  <div class="header" style="padding: 12px 18px; margin-bottom: 12px;">
    <h1 class="header-title" style="font-size: 14pt;">ধাপ ৬ ও ৭: টেস্ট স্যুট রান করা এবং ডকার মোড</h1>
  </div>

  <div class="section">
    <h2 class="section-title">
      <span class="step-badge">ধাপ ৬</span> সম্পূর্ণ টেস্ট স্যুট রান করা (Running 69 Automated Tests)
    </h2>
    <div class="card">
      <p style="font-size: 8.8pt; margin-bottom: 6px;">আমাদের রিপোজিটরিতে সম্পূর্ণ টেস্ট কাভারেজ রয়েছে। নিচের কমান্ডগুলো দিয়ে প্রতিটি টেস্ট পাস করছে কি না যাচাই করে নিন:</p>

      <div class="card" style="background: #ffffff; border-color: #cbd5e1; margin-bottom: 8px;">
        <div style="font-weight: 700; color: #0284c7; font-size: 9pt; margin-bottom: 4px;">১. ব্যাকএন্ড টেস্ট স্যুট (৩৬টি Pytest টেস্ট)</div>
        <div class="code-box">
          <span class="comment"># প্রজেক্ট রুট ফোল্ডার থেকে চালান</span><br>
          <span class="cmd">pytest backend/tests/</span><br>
          <span class="highlight"># ফলাফল: 36 passed in 1.28s (100% Green)</span>
        </div>
      </div>

      <div class="card" style="background: #ffffff; border-color: #cbd5e1; margin-bottom: 8px;">
        <div style="font-weight: 700; color: #10b981; font-size: 9pt; margin-bottom: 4px;">২. ফ্রন্টএন্ড টেস্ট স্যুট (১৮টি Vitest টেস্ট)</div>
        <div class="code-box">
          <span class="comment"># প্রজেক্ট রুট অথবা frontend ফোল্ডার থেকে চালান</span><br>
          <span class="cmd">npm test -- --run</span><br>
          <span class="highlight"># ফলাফল: 6 test files passed, 18 passed in 2.84s (100% Green)</span>
        </div>
      </div>

      <div class="card" style="background: #ffffff; border-color: #cbd5e1; margin-bottom: 8px;">
        <div style="font-weight: 700; color: #f59e0b; font-size: 9pt; margin-bottom: 4px;">৩. এআই ও রুলস ভ্যালিডেশন টেস্ট (১৫টি Pytest টেস্ট)</div>
        <div class="code-box">
          <span class="comment"># প্রজেক্ট রুট ফোল্ডার থেকে চালান</span><br>
          <span class="cmd">pytest ai_engine/tests/</span><br>
          <span class="highlight"># ফলাফল: 15 passed in 0.19s (100% Green)</span>
        </div>
      </div>

      <div class="card" style="background: #ffffff; border-color: #cbd5e1;">
        <div style="font-weight: 700; color: #6366f1; font-size: 9pt; margin-bottom: 4px;">৪. প্রোডাকশন বিল্ড ভেরিফিকেশন (TypeScript & Vite)</div>
        <div class="code-box">
          <span class="cmd">npm run build</span><br>
          <span class="highlight"># ফলাফল: built in 1.01s (Zero TypeScript errors)</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">
      <span class="step-badge">ধাপ ৭</span> সিঙ্গেল-কমান্ড ডকার ডেপ্লয়মেন্ট (Docker Compose Option)
    </h2>
    <div class="card">
      <p style="font-size: 8.8pt; margin-bottom: 4px;">আপনি যদি আলাদা টার্মিনালে পাইথন বা নোড না চালিয়ে সম্পূর্ণ সিস্টেম ডকারে এক ক্লিকে চালাতে চান:</p>
      
      <div class="code-box">
        <span class="comment"># প্রজেক্টের রুট ডিরেক্টরিতে কমান্ড দিন</span><br>
        <span class="cmd">docker compose up -d</span>
      </div>

      <p style="font-size: 8.5pt; margin-top: 6px;">ডকার স্বয়ংক্রিয়ভাবে ৩টি কনটেইনার চালু করে দেবে:</p>
      <table>
        <thead>
          <tr>
            <th>সার্ভিস</th>
            <th>পোর্ট</th>
            <th>ভূমিকা</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>predictrx-frontend</code></td>
            <td><code>http://localhost:5173</code></td>
            <td>Nginx দিয়ে রিয়্যাক্ট ১৯ প্রোডাকশন অ্যাপ ও রিভার্স প্রক্সি</td>
          </tr>
          <tr>
            <td><code>predictrx-backend</code></td>
            <td><code>http://localhost:8000</code></td>
            <td>FastAPI এআই ইঞ্জিন ও সিডিএসএস পাইপলাইন</td>
          </tr>
          <tr>
            <td><code>predictrx-postgres</code></td>
            <td><code>localhost:5434</code></td>
            <td>আইসোলেটেড PostgreSQL ১৬ ডাটাবেস (পোর্ট কনফ্লিক্ট নেই)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">
      <span class="step-badge">ধাপ ৮</span> ট্রাবলশুটিং ও হ্যাকথন প্রেজেন্টেশন ফেইলসেফ চেকলিস্ট
    </h2>
    <div class="card" style="background: #fffbeb; border-color: #fde68a;">
      <ul style="padding-left: 18px; font-size: 8.5pt; line-height: 1.6; color: #78350f;">
        <li><strong>পোর্ট কনফ্লিক্ট দেখা দিলে (Port in use):</strong> টার্মিনালে অন্য কোনো প্রসেস পোর্ট ৮০০০ বা ৫১৭৩ ব্লক করে রাখলে তা বন্ধ করুন অথবা কমান্ডে <code>--port 8001</code> ব্যবহার করুন।</li>
        <li><strong>হ্যাকথন ভেন্যুতে ইন্টারনেট বন্ধ হয়ে গেলে:</strong> আমাদের স্মার্ট লোকাল ক্যাশ (<১৫ms) এবং লোকাল SQLite ডাটাবেস সম্পূর্ণ অফলাইনে কাজ করে। কোনো বাহ্যিক ক্লাউড এপিআই ছাড়াই ৩টি গোল্ডেন সিনারিও নির্বিঘ্নে চলবে।</li>
        <li><strong>ব্রাউজারে বাংলা অডিও না বাজলে:</strong> ল্যাপটপের ভলিউম চেক করুন। গুগল ক্রোম বা মাইক্রোসফট এজে ওয়েবভিউতে একবার "শব্দে শুনুন" বাটনে ক্লিক করলে ব্রাউজারের স্পিচ ইঞ্জিন এক্টিভেট হয়ে যায়।</li>
        <li><strong>ব্যাকআপ ভিডিও ও স্লাইড:</strong> জাজদের সামনে প্রেজেন্টেশনের জন্য পেনড্রাইভে <code>PredictRx_Winning_Pitch_Deck.pdf</code> এবং <code>docs/DEMO_SCRIPT.md</code> সেভ করে রাখুন।</li>
      </ul>
    </div>
  </div>

</body>
</html>
"""

def generate_pdf():
    output_html = os.path.abspath("PredictRx_Setup_Run_and_Testing_Guide.html")
    output_pdf_root = os.path.abspath("PredictRx_Setup_Run_and_Testing_Guide.pdf")
    artifact_dir = r"C:\Users\User\.gemini\antigravity\brain\631c8e9b-5a9b-45d7-9d48-6c956ff00401"
    output_pdf_artifact = os.path.join(artifact_dir, "PredictRx_Setup_Run_and_Testing_Guide.pdf")
    
    print(f"Writing setup guide HTML to: {output_html}")
    with open(output_html, "w", encoding="utf-8") as f:
        f.write(HTML_SETUP_GUIDE)

    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        print(f"Edge not found at {edge_path}")
        sys.exit(1)

    temp_pdf = os.path.join(os.environ.get("TEMP", "."), "predict_rx_setup_guide_temp.pdf")
    cmd = [
        edge_path,
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        f"--print-to-pdf={temp_pdf}",
        f"file:///{output_html.replace(os.sep, '/')}"
    ]

    print("Executing Edge headless PDF export for Setup Guide...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("Edge return code:", res.returncode)

    if os.path.exists(temp_pdf):
        shutil.copy2(temp_pdf, output_pdf_root)
        print(f"Root PDF generated: {output_pdf_root} ({os.path.getsize(output_pdf_root) / 1024:.1f} KB)")
        if os.path.exists(artifact_dir):
            shutil.copy2(temp_pdf, output_pdf_artifact)
            print(f"Artifact PDF copied: {output_pdf_artifact}")
    else:
        print("Failed to find generated PDF from Edge!")
        sys.exit(1)

if __name__ == "__main__":
    generate_pdf()
