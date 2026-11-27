# PROJECT_STATE.md — PredictRx-AI (PredictRx BD)

## ১. বর্তমান অবস্থা (Current Status)
- **বর্তমান ধাপ:** Preliminary Round উত্তীর্ণ → **Final Round (Project Update Window: ৭–১৪ ডিসেম্বর ২০২৬)**-এর জন্য প্রস্তুতি পর্যায়।
- **সর্বশেষ আপডেট তারিখ:** ২৭ নভেম্বর ২০২৬ (সর্বশেষ কমিট: `752c4e1` on `feature/ai-rag-engine` / `origin/main` সিঙ্কড)।
- **লাইভ ডিপ্লয়মেন্ট:**
  - Frontend (Vercel): `https://predict-rx-ai.vercel.app`
  - Backend API (Railway): `https://predictrx-ai-production.up.railway.app`
- **পরবর্তী কাজ:** `test_smart_cache.py` ও `PrescriptionAnalysis.test.tsx`-এর ২টি পুরানো টেস্ট অ্যাসার্শন ফিক্স করা এবং ৭–১৪ ডিসেম্বর প্রজেক্ট আপডেট উইন্ডোতে ফাইনাল রাউন্ডের ইমপ্রুভমেন্টসমূহ (রিয়েল-টাইম Vision OCR কভারেজ, DGDA ক্যাটালগ সম্প্রসারণ, ক্লিনিক্যাল এজ-কেস ও লাইভ ডেমো পলিশ) সম্পন্ন করা।

---

## ২. অনুমোদিত টেক স্ট্যাক ও আর্কিটেকচার সিদ্ধান্ত (Locked Decisions)
- **Backend (`backend/`):** Python + **FastAPI** (`>=0.115.0`), **Uvicorn**, **Pydantic v2**, **SQLAlchemy 2.0**, **Alembic**, **ReportLab** (PDF জেনারেটর), **gTTS** (বাংলা/ইংরেজি অডিও ভয়েস)। কন্টেইনার পোর্ট `8080` (Railway `backend/Dockerfile` ও `railway.json`)।
- **Frontend (`frontend/`):** **React 19** (`19.3.1`), **TypeScript**, **Vite 8**, **Tailwind CSS v3.4**, **Radix UI** কম্পোনেন্টস, **React Router v7**, **TanStack Query v5**, **React Hook Form + Zod**, **Recharts** (SHAP ও ড্যাশবোর্ড চার্ট), **i18next / react-i18next** (বাইলিঙ্গুয়াল EN/BN), **Lucide Icons**, **Sonner**। Vercel-এ ডিপ্লয়েড (`frontend/vercel.json` SPA রি-রাইটসহ)।
- **Database & Cache:**
  - **PostgreSQL 18.6** (Production on Railway) / **SQLite (`backend/predictrx.db`)** (লোকাল ডেভ/টেস্ট ফলব্যাক; ডকার পোর্ট `5434` config-এ সমর্থিত)।
  - **Smart Offline Cache (`backend/app/cache/smart_cache.py`):** সাব-১৫ms ফেইল-সেফ রেসপন্সের জন্য `SmartCacheService`-এ ৫টি Golden Clinical Demo Scenarios (`GOLDEN_01` থেকে `GOLDEN_05`) SHA-256 হ্যাশ ও সুনির্দিষ্ট প্রোফাইল/ড্রাগ ম্যাচিংসহ যুক্ত (জেনেরিক CKD/eGFR<45 ওভার-ম্যাচিং বাগ ইতিমধ্যেই অপসারিত)।
  - **TTS In-Memory Cache:** `predict_rx.py`-তে MD5-ভিত্তিক ইন-মেমোরি অডিও ক্যাশ (সর্বোচ্চ ১২০টি স্নিপেট)।
- **Auth & Security Strategy:** JWT (`pyjwt`, `HS256`, ২৪ ঘণ্টা এক্সপায়ারি) ও `pwdlib[bcrypt]` পাসওয়ার্ড হ্যাশিং। `/analyze` এন্ডপয়েন্টে `get_optional_user` থাকায় লগইন ছাড়াও ডেমো/অতিথি অ্যানালাইসিস করা যায় এবং লগইন করা থাকলে ক্লিনিশিয়ান আইডি/রিভিউ অডিট লগ সংরক্ষিত হয়। `CORS` কনফিগারেশন `BACKEND_CORS_ORIGINS` দ্বারা নিয়ন্ত্রিত।
- **AI Models & Orchestration (`ai_engine/` + `backend/app/services/analysis_orchestrator.py`):**
  - **Vision LLM Layer (`ai_engine/app/extractor.py`):** `GeminiExtractor` (`google-genai`, ফলব্যাক চেইন: `GEMINI_MODEL` → `gemini-3.8-flash` → `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` → `gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-3.7-flash`) এবং `AnthropicExtractor` (`claude-sonnet-5-5`, টুল-ইউজ ফোর্সড স্কিমা)।
  - **Deterministic Validation (`ai_engine/app/validator.py`):** বাংলাদেশি ডোজ নোটেশন (`1+0+1`, `১-০-১`, `½+0+½`, `OD/BD/TDS`), সময় (`খাবার আগে/পরে`, `a.c/p.c`), মেয়াদ ও ক্লিনিক্যাল গার্ডরেল যাচাই।
  - **8-Stage CDSS Orchestrator (`AnalysisOrchestrator`):** Drug Normalization → Syntax Validation → Drug-Drug & Drug-Disease Interaction Check → **XGBoost + SHAP** ML Risk Prediction (`backend/app/ml/`) → Safer Alternatives → Bangla Patient Companion → DB Persistence & Audit Log।

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
│   │   ├── extractor.py                # Gemini / Anthropic Vision LLM অ্যাডাপ্টার ও প্রম্পট
│   │   ├── pipeline.py                 # Self-consistency majority voting (votes=1 বা 3)
│   │   ├── preprocess.py               # ইমেজ প্রি-প্রসেসিং
│   │   ├── drug_rules.py               # ডোজ/সিলিং সেফটি রুলস
│   │   ├── validator.py                # বাংলা/ইংরেজি ডোজ ও ডিউরেশন পার্সার
│   │   └── schemas.py                  # RawPrescription / RawMedicine স্কিমা
│   ├── eval/                           # এক্সট্র্যাকশন ইভ্যালুয়েশন স্ক্রিপ্ট ও গ্রাউন্ড ট্রুথ
│   └── tests/test_validator.py
├── backend/                            # Layer 2: FastAPI CDSS Backend + ML + PostgreSQL
│   ├── Dockerfile
│   ├── alembic.ini & alembic/versions/ # ২টি মাইগ্রেশন (initial_schema, preferred_language)
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                     # FastAPI অ্যাপ এন্ট্রিপয়েন্ট, CORS, Exception Handlers
│   │   ├── api/v1/router.py & endpoints/
│   │   │   ├── auth.py, dashboard.py, drugs.py, evidence.py,
│   │   │   ├── health.py, interactions.py, patients.py, predict_rx.py, reports.py
│   │   ├── cache/smart_cache.py        # ৫টি গোল্ডেন সিনারিও ও SHA-256 ফাস্ট-পাথ ক্যাশ
│   │   ├── core/                       # config.py, constants.py, exceptions.py, security.py
│   │   ├── db/seeds/bd_drugs_data.py   # DGDA ড্রাগ, ইন্টারঅ্যাকশন ও এভিডেন্স সিড ডেটা
│   │   ├── i18n/                       # translator.py, locales/bn.json, en.json
│   │   ├── ml/                         # XGBoost মডেল (.joblib/.json), risk_predictor.py, SHAP
│   │   ├── models/                     # SQLAlchemy ORM মডেলসমূহ
│   │   ├── repositories/               # DB CRUD রিপোজিটরি লেয়ার
│   │   ├── schemas/                    # Pydantic রিকোয়েস্ট/রেসপন্স স্কিমা
│   │   └── services/                   # AnalysisOrchestrator ও ৭টি ডোমেইন সার্ভিস
│   └── tests/                          # ১০টি pytest টেস্ট ফাইল (৪১টি টেস্ট কেস)
├── frontend/                           # Layer 3: React 19 + TypeScript + Tailwind SPA
│   ├── vercel.json
│   ├── package.json
│   ├── public/pitch_deck.html
│   └── src/
│       ├── app/                        # App.tsx, router.tsx, AuthProvider, ThemeProvider
│       ├── components/clinical/        # BanglaPatientCompanion, ClinicianReviewModal,
│       │                               # DemoScenarioSwitcher, PrescriptionScanningModal,
│       │                               # RiskGaugeCard, ShapWaterfallChart
│       ├── components/layout/          # AppLayout, LanguageToggle, Sidebar, TopNav
│       ├── constants/                  # index.ts, scenario_porag.ts, scenario_abdur_rahman.ts
│       ├── features/                   # Dashboard, PrescriptionAnalysis, DrugInteraction,
│       │                               # Patients, Prescriptions, ClinicalRiskAnalysis,
│       │                               # BanglaCompanion, ClinicalReport, Auth, Settings
│       ├── i18n/locales/               # bn/*.json ও en/*.json (১১টি করে নেমস্পেস ফাইল)
│       ├── services/                   # apiClient.ts, prescriptionService.ts, authService.ts, ইত্যাদি
│       └── test/                       # ৭টি Vitest টেস্ট স্যুট (৩৬টি টেস্ট কেস)
└── docs/                               # API_CONTRACT.md, INTERNATIONALIZATION.md, PDF গাইড ও পিচ ডেক
```

---

## ৪. ডেটাবেস স্কিমা ও API কন্ট্রাক্ট সারসংক্ষেপ
### মূল ডেটাবেস টেবিলসমূহ (`backend/app/models/`)
- `users` (`User`) — ক্লিনিশিয়ান অ্যাকাউন্ট, ভূমিকা ও `preferred_language`
- `patients` (`Patient`) ও `patient_clinical_profiles` (`PatientClinicalProfile`) — MRN, বয়স, লিঙ্গ, ওজন, ক্রিয়েটিনিন, eGFR, HbA1c, রক্তচাপ, রোগ ও পূর্ববর্তী ওষুধ
- `prescriptions` (`Prescription`) ও `prescription_medications` (`PrescriptionMedication`) — আপলোডকৃত প্রেসক্রিপশন ও নিষ্কাশিত ওষুধের তালিকা
- `prescription_analyses` (`PrescriptionAnalysis`) — রিস্ক স্কোর, SHAP ফিচার, ইন্টারঅ্যাকশন, ক্লিনিশিয়ান রিভিউ স্টেটাস ও নোট
- `prescription_audit_logs` (`PrescriptionAuditLog`) — সম্পূর্ণ ক্লিনিক্যাল অডিট ট্রেইল
- `bd_drugs_catalog` (`BDDrugCatalog`) — DGDA অনুমোদিত বাংলাদেশি ব্র্যান্ড ও জেনেরিক ক্যাটালগ
- `drug_interactions_matrix` (`DrugInteractionMatrix`) — মেকানিজম, সেভেরিটি ও ম্যানেজমেন্ট প্রোটোকল
- `clinical_evidence` (`ClinicalEvidence`) — KDIGO, AGS Beers, CMAJ ইত্যাদি গাইডলাইন সাইটেশন

### সম্পন্ন API এন্ডপয়েন্টসমূহ (`/api/v1/...` এবং `/health`)
- **Health:** `GET /health`, `GET /api/v1/health`, `GET /`
- **Auth (`/api/v1/auth`):** `POST /login`, `POST /register`, `GET /me`, `PATCH /me/preferences`
- **PredictRx CDSS (`/api/v1/predict-rx`):**
  - `POST /analyze` (মাল্টিপার্ট প্রেসক্রিপশন ফাইল + `patient_context` বা JSON পেলোড)
  - `GET /prescriptions`, `GET /prescriptions/{id}`, `POST /prescriptions/{id}/review`
  - `GET /cache/status`, `GET /scenarios`, `GET /scenarios/{scenario_id}`
  - `POST /tts` (বাংলা/ইংরেজি ভয়েস অডিও `audio/mpeg`)
- **Patients (`/api/v1/patients`):** `GET ""`, `GET /{id}`, `GET /{patient_id}/prescriptions`, `POST ""`
- **Drugs & Interactions:** `GET /api/v1/drugs`, `GET /api/v1/drugs/{id}`, `GET /api/v1/drug-interactions`, `POST /api/v1/drug-interactions/check`, `GET /api/v1/drug-interactions/{id}`
- **Evidence, Dashboard & Reports:** `GET /api/v1/evidence`, `GET /api/v1/dashboard/overview`, `GET /api/v1/reports/{prescription_id}`, `GET /api/v1/reports/{prescription_id}/pdf`

---

## ৫. সম্পন্ন ফিচার ও টেস্ট স্ট্যাটাস
- [x] **Multimodal Vision OCR + Self-Consistency Voting (`ai_engine/`):** Gemini (একাধিক ফলব্যাক মডেলসহ) ও Anthropic অ্যাডাপ্টার, বাংলা/ইংরেজি ডোজ পার্সিং, রক্তচাপ ও বয়স এক্সট্র্যাকশন।
- [x] **8-Stage CDSS Orchestrator & XGBoost SHAP Risk Model:** ড্রাগ-ড্রাগ ও ড্রাগ-ডিজিজ ইন্টারঅ্যাকশন (Ketorolac+ARB, Triple Whammy, Pediatric Aspirin/Reye's, CKD-4 Metformin Lactic Acidosis), SHAP ওয়াটারফল ব্যাখ্যা ও সেফার অল্টারনেটিভ।
- [x] **৫টি Golden Clinical Scenarios (`GOLDEN_01` – `GOLDEN_05`):** Abdul Karim (CKD-3a + Ketorolac), Begum Rokeya (Triple Whammy), Master Ayan (Pediatric Aspirin), Porag (Lewy Body Dementia), Md. Abdur Rahman (CKD-4 Nephrology)।
- [x] **অপটিক্যাল লেজার স্ক্যানার ও অটো-ফিল UI (`PrescriptionScanningModal.tsx`):** প্রেসক্রিপশন আপলোডে রিয়েল-টাইম AI পারসেপশন ও ফর্ম অটো-ফিল (`752c4e1`, `5ae3885`, `45437f1`)।
- [x] **বাইলিঙ্গুয়াল (EN/BN) ইন্টারফেস, বাংলা কম্প্যানিয়ন TTS ও PDF রিপোর্ট:** পূর্ণাঙ্গ `i18next` লোকালাইজেশন (`bn`/`en`), `gTTS` ভয়েস রিডআউট এবং ডাউনলোডযোগ্য ক্লিনিক্যাল PDF অডিট রিপোর্ট।
- [x] **ফ্রন্টএন্ড প্রোডাকশন বিল্ড:** `npm --prefix frontend run build` (`tsc -b && vite build`) — **সফল** (২৭ নভেম্বর ২০২৬ অনুযায়ী)।
- [ ] **ব্যাকএন্ড ও ফ্রন্টএন্ড রিগ্রেশন টেস্ট ফিক্স:** ২৭ নভেম্বর ২০২৬-এ সর্বশেষ রান অনুযায়ী:
  - Backend (`pytest backend/tests/`): **৪০ পাস, ১ ফেইল** (`test_smart_cache.py::test_golden_scenarios_preseeded` — `s4["name"]` `'প্রেসক্রিপশনে অপ্রকাশিত (Redacted)'` হওয়ায় `"Porag"` অ্যাসার্শন আপডেট প্রয়োজন)।
  - Frontend (`vitest run`): **৩৫ পাস, ১ ফেইল** (`PrescriptionAnalysis.test.tsx:38` — UI বাটন টেক্সট পরিবর্তনের পর `/Run Full CDSS Safety Evaluation/i` সিলেক্টর আপডেট প্রয়োজন)।

---

## ৬. পরিচিত সীমাবদ্ধতা / টেকনিক্যাল ডেট (Known Issues & TODOs)
1. **অবিলম্বে ফিক্সযোগ্য টেস্ট ড্রিফট:** `5ae3885` ও `752c4e1` কমিটের পর `backend/tests/test_smart_cache.py` এবং `frontend/src/test/PrescriptionAnalysis.test.tsx` আপডেট না করায় ২টি টেস্ট ফেইল করছে; ফাইনাল রাউন্ডের কাজের শুরুতেই এগুলো ফিক্স করতে হবে।
2. **লাইভ Vision OCR ও API Key নির্ভরতা:** প্রোডাকশন সার্ভার (`Railway`)-এ `GEMINI_API_KEY` কোটা বা রেট-লিমিট শেষ হলে বা অচেনা প্রেসক্রিপশন এলে ফলব্যাক বেসলাইন যেন ব্যবহারকারীর দেওয়া বা আংশিক এক্সট্র্যাক্টকৃত ওষুধ হারিয়ে না ফেলে, সেদিকে আরও উন্নতি করা দরকার।
3. **DGDA ড্রাগ ডেটাবেস ও ইন্টারঅ্যাকশন কভারেজ:** হ্যাকাথন ফাইনাল রাউন্ডে জাজদের যেকোনো র‍্যান্ডম প্রেসক্রিপশন পরীক্ষায় উচ্চ নির্ভুলতা নিশ্চিত করতে `bd_drugs_data.py` এবং ফাজি ব্র্যান্ড ম্যাচিং আরও সমৃদ্ধ করা যেতে পারে।
4. **`CORS` ও `SECRET_KEY` প্রোডাকশন হার্ডেনিং:** `backend/app/core/config.py`-তে ডিফল্ট `BACKEND_CORS_ORIGINS`-এ `"*"` এবং ডিফল্ট `SECRET_KEY` রয়েছে; প্রোডাকশন এনভায়রনমেন্ট ভ্যারিয়েবলে এগুলো সীমাবদ্ধ ও যাচাই করা উচিত।
5. **ফাইনাল রাউন্ড আপডেট উইন্ডো (৭–১৪ ডিসেম্বর ২০২৬):** নতুন ফিচার বা রিফাইনারি (যেমন: আরও স্পষ্ট ক্লিনিক্যাল ডোজ ক্যালকুলেশন, অ্যালার্জি ক্রস-রিঅ্যাক্টিভিটি চেক, রিয়্যাক্ট টেস্টের `act(...)` ওয়ার্নিং ও Recharts জিরো-সাইজ ওয়ার্নিং ক্লিনআপ, এবং আপডেটেড পিচ ডেক) সম্পন্ন করে পুনরায় Vercel ও Railway-তে ভেরিফাই করতে হবে।
