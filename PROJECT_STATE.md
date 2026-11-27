# PROJECT_STATE.md — PredictRx-AI (PredictRx BD)

## ১. বর্তমান অবস্থা (Current Status)
- **বর্তমান ধাপ:** Preliminary Round উত্তীর্ণ → **Final Round (Project Update Window: ৭–১৪ ডিসেম্বর ২০২৬)**-এর জন্য ইঞ্জিনিয়ারিং, ক্লিনিক্যাল গার্ডরেল, সিকিউরিটি হার্ডেনিং ও পিচ ডেক আপডেট সম্পন্ন (কমিট ও লাইভ ডিপ্লয়মেন্ট ভেরিফিকেশন বাকি)।
- **সর্বশেষ আপডেট তারিখ:** ২৭ নভেম্বর ২০২৬ (বেসলাইন কমিট `02082a2` on `main` + ফাইনাল রাউন্ড Milestones 1–4 ওয়ার্কিং ট্রিতে যুক্ত)।
- **লাইভ ডিপ্লয়মেন্ট:**
  - Frontend (Vercel): `https://predict-rx-ai.vercel.app`
  - Backend API (Railway): `https://predictrx-ai-production.up.railway.app`
- **পরবর্তী কাজ:** বর্তমান পরিবর্তনগুলো রিভিউ/কমিট করে GitHub-এ পুশ করা, Railway এনভায়রনমেন্টে `SECRET_KEY` + `ENFORCE_PROD_SECRETS=true` + `GEMINI_API_KEY` সেট করা এবং ৭–১৪ ডিসেম্বর প্রজেক্ট আপডেট উইন্ডোতে Vercel/Railway লাইভ ভেরিফিকেশন সম্পন্ন করা।

---

## ২. অনুমোদিত টেক স্ট্যাক ও আর্কিটেকচার সিদ্ধান্ত (Locked Decisions)
- **Backend (`backend/`):** Python + **FastAPI** (`>=0.115.0`), **Uvicorn**, **Pydantic v2**, **SQLAlchemy 2.0**, **Alembic**, **ReportLab** (PDF জেনারেটর), **gTTS** (বাংলা/ইংরেজি অডিও ভয়েস)। কন্টেইনার পোর্ট `8080` (Railway `backend/Dockerfile` ও `railway.json`)।
- **Frontend (`frontend/`):** **React 19** (`19.3.1`), **TypeScript**, **Vite 8**, **Tailwind CSS v3.4**, **Radix UI** কম্পোনেন্টস, **React Router v7**, **TanStack Query v5**, **React Hook Form + Zod**, **Recharts** (SHAP ও ড্যাশবোর্ড চার্ট), **i18next / react-i18next** (বাইলিঙ্গুয়াল EN/BN), **Lucide Icons**, **Sonner**। Vercel-এ ডিপ্লয়েড (`frontend/vercel.json` SPA রি-রাইটসহ)।
- **Database & Cache:**
  - **PostgreSQL 18.6** (Production on Railway) / **SQLite (`backend/predictrx.db`)** (লোকাল ডেভ/টেস্ট ফলব্যাক; ডকার পোর্ট `5434` config-এ সমর্থিত)। স্টার্টআপ `lifespan`-এ ইডем্পোটেন্ট ১-কোয়েরি DGDA ক্যাটালগ সিঙ্ক (`seed_bd_drugs`) যুক্ত।
  - **DGDA Master Catalog (`bd_drugs_data.py` + `bd_drugs_data_ext.py`):** **৪০৮টি ইউনিক বাংলাদেশি ব্র্যান্ড ও জেনেরিক এন্ট্রি** (১৩০+ থেরাপিউটিক ক্লাস) এবং O(1) ইন-মেমোরি ইনডেক্সিং (`_brand_map`, `_brand_base_map`) ও স্মার্ট টোকেনাইজার (`Sergel-20mg` বনাম `Cef-3`)।
  - **Smart Offline Cache (`backend/app/cache/smart_cache.py`):** সাব-১৫ms ফেইল-সেফ রেসপন্সের জন্য `SmartCacheService`-এ ৫টি Golden Clinical Demo Scenarios (`GOLDEN_01` থেকে `GOLDEN_05`) SHA-256 হ্যাশসহ; ফেইল্ড বা `OCR_DEGRADED_FALLBACK` রেসপন্স ক্যাশ-পয়জনিং থেকে সুরক্ষিত।
  - **TTS In-Memory Cache:** `predict_rx.py`-তে MD5-ভিত্তিক ইন-মেমোরি অডিও ক্যাশ (সর্বোচ্চ ১২০টি স্নিপেট)।
- **Auth & Security Strategy (`backend/app/core/config.py` + `security_middleware.py`):**
  - JWT (`pyjwt`, `HS256`, ২৪ ঘণ্টা এক্সপায়ারি) ও `pwdlib[bcrypt]` পাসওয়ার্ড হ্যাশিং। `/analyze` এন্ডপয়েন্টে `get_optional_user` থাকায় ডেমো ও লগইনড ক্লিনিশিয়ান উভয়েই ব্যবহার করতে পারেন।
  - **OWASP Hardening:** ডিফল্ট `BACKEND_CORS_ORIGINS` থেকে `"*"` অপসারণ + `BACKEND_CORS_ORIGIN_REGEX`, `SecurityHeadersAndTraceMiddleware` (`X-Request-ID`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cache-Control: no-store`, প্রোডাকশনে `HSTS`), স্লাইডিং-উইন্ডো রেট লিমিটার (`/auth/*` ও `/predict-rx/analyze`/`/tts`-এ `429` + `Retry-After`), এবং `ENFORCE_PROD_SECRETS` ফ্ল্যাগ।
- **AI Models, OCR Resilience & 5-Domain Clinical Guardrails (`ai_engine/` + `backend/app/services/`):**
  - **Vision LLM Layer (`ai_engine/app/extractor.py`, `prompts.py`, `preprocess.py`, `pipeline.py`):** ভার্সনড প্রম্পট (`rx_bd_v2.0`, প্রম্পট-ইনজেকশন গার্ডরেলসহ), PDF (`%PDF-`) ও ইমেজ নিরাপদ প্রি-প্রসেসিং (`10 MB` লিমিট + ডিকম্প্রেশন-বম্ব সুরক্ষা), `ResilientExtractor` (এক্সপোনেনশিয়াল ব্যাকঅফ + Gemini↔Anthropic ফেইলওভার), অ্যাডাপ্টিভ ১→৩ পাস সেলফ-কনসিস্টেন্সি ভোটিং (`legibility < 0.72` বা `confidence < 0.75`), এবং `OCR_DEGRADED_FALLBACK` (OCR ব্যর্থ হলেও `current_medications` বিশ্লেষণ অব্যাহত থাকে)।
  - **Deterministic Validation (`ai_engine/app/validator.py` + `drug_rules.py`):** বাংলাদেশি ডোজ নোটেশন (`1+0+1`, `১-০-১`, `½+0+½`, `OD/BD/TDS`), সময় (`খাবার আগে/পরে`, `a.c/p.c`), মেয়াদ ও সিলিং যাচাই।
  - **5-Domain Clinical Guardrails (`backend/app/services/clinical_guardrail_service.py`) & 8-Stage Orchestrator:** Allergy Cross-Reactivity (Penicillin/Cephalosporin, Sulfa, NSAID), Renal (CKD/eGFR: Metformin, NSAIDs, Etoricoxib, Spironolactone), Hepatic/Liver, Pregnancy Teratogenicity, এবং Pediatric ওজন-ভিত্তিক (`60 mg/kg/day`) ডোজ চেক + **XGBoost + SHAP** ML Risk Prediction + `drug_disease_conflicts`/`contraindications` DB পার্সিস্টেন্স।

---

## ৩. বর্তমান ফোল্ডার স্ট্রাকচার (Folder Tree)
```text
PredictRx-AI/
├── PROJECT_STATE.md
├── README.md
├── docker-compose.yml
├── railway.json
├── run_project.bat
├── ai_engine/                          # Layer 1: Multimodal Vision OCR + Rule Validator
│   ├── cli.py
│   ├── app/
│   │   ├── prompts.py                  # Versioned BD Rx prompts (rx_bd_v2.0) + injection guardrails
│   │   ├── extractor.py                # ResilientExtractor, Gemini & Anthropic adapters + backoff
│   │   ├── pipeline.py                 # Adaptive 1->3 pass self-consistency majority voting
│   │   ├── preprocess.py               # PDF pass-through, size/pixel guard, EXIF/autocontrast
│   │   ├── drug_rules.py               # ডোজ/সিলিং সেফটি রুলস
│   │   ├── validator.py                # বাংলা/ইংরেজি ডোজ ও ডিউরেশন পার্সার
│   │   └── schemas.py                  # RawPrescription (labs/allergiesসহ) / RawMedicine স্কিমা
│   ├── eval/                           # এক্সট্র্যাকশন ইভ্যালুয়েশন স্ক্রিপ্ট ও গ্রাউন্ড ট্রুথ
│   └── tests/test_validator.py         # ১৮টি pytest টেস্ট কেস
├── backend/                            # Layer 2: FastAPI CDSS Backend + ML + PostgreSQL
│   ├── Dockerfile
│   ├── alembic.ini & alembic/versions/ # ২টি মাইগ্রেশন (initial_schema, preferred_language)
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                     # FastAPI অ্যাপ, CORS, Security Middleware, Startup Sync
│   │   ├── api/v1/router.py & endpoints/
│   │   │   ├── auth.py, dashboard.py, drugs.py, evidence.py,
│   │   │   ├── health.py, interactions.py, patients.py, predict_rx.py, reports.py
│   │   ├── cache/smart_cache.py        # ৫টি গোল্ডেন সিনারিও ও SHA-256 ফাস্ট-পাথ ক্যাশ
│   │   ├── core/                       # config.py, constants.py, exceptions.py, security.py, security_middleware.py
│   │   ├── db/seeds/                   # bd_drugs_data.py + bd_drugs_data_ext.py (৪০৮ DGDA ড্রাগ)
│   │   ├── i18n/                       # translator.py, locales/bn.json, en.json
│   │   ├── ml/                         # XGBoost মডেল (.joblib/.json), risk_predictor.py, SHAP
│   │   ├── models/                     # SQLAlchemy ORM মডেলসমূহ
│   │   ├── repositories/               # DB CRUD রিপোজিটরি লেয়ার
│   │   ├── schemas/                    # Pydantic রিকোয়েস্ট/রেসপন্স স্কিমা
│   │   └── services/                   # AnalysisOrchestrator, ClinicalGuardrailService ও ৭টি সার্ভিস
│   └── tests/                          # ১৩টি pytest টেস্ট ফাইল (৫০টি টেস্ট কেস)
├── frontend/                           # Layer 3: React 19 + TypeScript + Tailwind SPA
│   ├── vercel.json
│   ├── package.json
│   ├── public/pitch_deck.html          # ফাইনাল রাউন্ড ১০-স্লাইড পিচ ডেক
│   └── src/
│       ├── app/                        # App.tsx, router.tsx, AuthProvider, ThemeProvider
│       ├── components/clinical/        # BanglaPatientCompanion, ClinicianReviewModal,
│       │                               # DemoScenarioSwitcher, PrescriptionScanningModal,
│       │                               # RiskGaugeCard, ShapWaterfallChart
│       ├── components/layout/          # AppLayout, LanguageToggle, Sidebar, TopNav
│       ├── constants/                  # index.ts, scenario_porag.ts, scenario_abdur_rahman.ts
│       ├── features/                   # Dashboard, PrescriptionAnalysis, DrugInteraction, ইত্যাদি
│       ├── i18n/locales/               # bn/*.json ও en/*.json (১১টি করে নেমস্পেস ফাইল)
│       ├── services/                   # apiClient.ts, prescriptionService.ts, authService.ts, ইত্যাদি
│       └── test/                       # ৭টি Vitest টেস্ট স্যুট (৩৬টি টেস্ট কেস, জিরো ওয়ার্নিং)
└── docs/                               # API_CONTRACT.md, INTERNATIONALIZATION.md, PDF গাইড ও পিচ ডেক
```

---

## ৪. সম্পন্ন ফিচার ও সর্বশেষ টেস্ট স্ট্যাটাস (২৭ নভেম্বর ২০২৬)
- [x] **Milestone 1 — Resilient Adaptive Vision OCR:** `rx_bd_v2.0` প্রম্পট, PDF + ইমেজ সাপোর্ট, `ResilientExtractor` (ব্যাকঅফ + Gemini↔Anthropic ফেইলওভার), অ্যাডাপ্টিভ ১→৩ পাস ভোটিং ও `OCR_DEGRADED_FALLBACK`।
- [x] **Milestone 2 — DGDA ক্যাটালগ সম্প্রসারণ (৪০৮ এন্ট্রি) ও O(1) নর্মালাইজেশন:** `bd_drugs_data_ext.py` যোগ, স্টার্টআপ ইডем্পোটেন্ট অটো-সিঙ্ক ও স্মার্ট টোকেনাইজার।
- [x] **Milestone 3 — ৫-ডোমেইন ক্লিনিক্যাল সেফটি গার্ডরেল (`ClinicalGuardrailService`):** Allergy Cross-Reactivity, CKD/eGFR, Hepatic/Liver, Pregnancy Teratogenicity, Pediatric weight dosing ও `etoricoxib` Triple Whammy।
- [x] **Milestone 4 — Security Hardening ও জিরো-ওয়ার্নিং টেস্ট:** নো-ওয়াইল্ডকার্ড CORS, OWASP Security Headers, `X-Request-ID`, স্লাইডিং-উইন্ডো রেট লিমিটার ও `act(...)`/Recharts ওয়ার্নিং ক্লিনআপ।
- [x] **Milestone 5 — UX/UI ভিজ্যুয়াল ইমপ্যাক্ট ও PDF ফলব্যাক:** বাংলা কম্প্যানিয়ন ডোজ পিকটোগ্রাম/রিমাইন্ডার/স্পিড কন্ট্রোল, ReportLab/`%PDF-1.4` পোর্টেবল PDF ফলব্যাক ও HITL Clinician Sign-Off ব্যানার।
- [x] **Milestone 6 — লাইভ ডেমো ও ডিপ্লয়মেন্ট স্ট্যাবিলিটি:** `/ready` প্রোব, `App.tsx` সাইলেন্ট ব্যাকএন্ড প্রি-ওয়ার্ম, কোল্ড-স্টার্ট GET রিট্রাই, `Dockerfile` নন-রুট + কিপ-অ্যালাইভ, `vercel.json` ক্যাশ/সিকিউরিটি হেডার, ও ডকুমেন্টেশন/পিচ ডেক সিঙ্ক।
- [x] **সর্বশেষ সম্পূর্ণ টেস্ট ও বিল্ড ভেরিফিকেশন (১০৭ / ১০৭ পাস):**
  - `pytest ai_engine/tests/`: **18 passed**
  - `pytest backend/tests/`: **52 passed**
  - `npx vitest run` (`frontend/`): **7 files, 37 passed** (০টি ওয়ার্নিং)
  - `npm --prefix frontend run build` (`tsc -b && vite build`): **সফল**

---

## ৫. ফাইনাল রাউন্ড ডিপ্লয়মেন্ট ও বাকি চেকলিস্ট (৭–১৪ ডিসেম্বর ২০২৬)
1. **Git Commit & Push:** বর্তমান সব পরিবর্তন রিভিউ করে কমিট ও পুশ করা।
2. **Railway Production Env Vars:** Railway ড্যাশবোর্ডে `SECRET_KEY` (শক্তিশালী র‍্যান্ডম কী), `ENFORCE_PROD_SECRETS=true`, এবং সচল `GEMINI_API_KEY` (ঐচ্ছিকভাবে `ANTHROPIC_API_KEY`) যাচাই করা।
3. **PDF Pitch Deck রিজেনারেশন (ঐচ্ছিক):** `frontend/public/pitch_deck.html` ব্রাউজারে খুলে `P` (Print to PDF) দিয়ে চাইলে [docs/PredictRx_Pitch_Deck.pdf](file:///d:/projects/PredictRx-AI/docs/PredictRx_Pitch_Deck.pdf) আপডেট করে নেওয়া।
4. **Live Smoke Check:** Vercel (`https://predict-rx-ai.vercel.app`) ও Railway (`https://predictrx-ai-production.up.railway.app/health`) ডিপ্লয়মেন্টের পর একটি রিয়েল প্রেসক্রিপশন (ছবি/PDF) দিয়ে লাইভ এন্ড-টু-এন্ড টেস্ট করা।
