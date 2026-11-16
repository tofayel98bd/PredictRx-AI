# PredictRx BD — Golden Prescription Test Dataset

This directory contains **15 authentic, high-resolution test prescription images** (`rx01.jpg` - `rx15.jpg`) and a standardized evaluation ground truth (`ai_engine/eval/ground_truth.json`) representing real-world clinical prescribing challenges in Bangladesh.

---

## 📋 Dataset Catalog & Clinical Rationale

| Case ID | File | Patient Profile | Prescribed Medicines | Clinical Challenge / Expected Alert | Risk Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **rx01** | `rx01.jpg` | Md. Abdul Karim (62M, CKD-3) | Bizoran 5/20 + Rolac 10 (14 days) | **Ketorolac 5-day ceiling exceeded** + Acute ARB nephrotoxicity clash | **CRITICAL** |
| **rx02** | `rx02.jpg` | Begum Rokeya (54F, Heart Failure) | Angilock 50 + Lasix 40 + Rolac 10 | **"Triple Whammy"**: ACEi/ARB + Diuretic + NSAID hemodynamic collapse | **CRITICAL** |
| **rx03** | `rx03.jpg` | Master Ayan (7M, Viral Flu) | Ecosprin 75 + Ceevit 250 | **Pediatric Aspirin contraindication**: Fatal Reye's syndrome hazard | **CRITICAL** |
| **rx04** | `rx04.jpg` | Haji Nurul Islam (74M, T2DM) | Glibenclamide 5 + Metfo 850 + Napa 500 | **Sulfonylurea hypoglycemia risk** in elderly (>70 years) | **HIGH** |
| **rx05** | `rx05.jpg` | Mrs. Nasreen Akter (28F, Pregnant 1st Trim) | Ciprocin 500 + Seclo 20 | **Fluoroquinolone cartilage toxicity** in 1st trimester pregnancy | **CRITICAL** |
| **rx06** | `rx06.jpg` | Kazi Mahfuzur Rahman (45M, Ulcer) | Aceclofenac 100 + Pantobex 20 | **NSAID upper GI bleeding risk** in active peptic ulcer disease | **HIGH** |
| **rx07** | `rx07.jpg` | Jannatul Ferdous (36F, Asthma) | Indever 40 (Propranolol) + Napa Extend | **Non-selective beta-blocker bronchospasm** in active asthma | **CRITICAL** |
| **rx08** | `rx08.jpg` | Solaiman Shikdar (52M, Cirrhosis) | Napa 500 (2+2+2 = 3000mg/day) + Urso 300 | **High-dose Paracetamol hepatotoxicity** in hepatic impairment | **HIGH** |
| **rx09** | `rx09.jpg` | Md. Rafiqul Islam (60M, HTN 175/105) | Norvask 5 + Rhinil (Pseudoephedrine) | **Sympathomimetic vasoconstrictor** exacerbating stage-2 hypertension | **MEDIUM** |
| **rx10** | `rx10.jpg` | Baby Samia (3F, Otitis Media, 13.5kg) | Moxaclav 156 Susp + Tofen Syrup | **Pediatric weight-based dose safety check** (45 mg/kg/day target) | **LOW** |
| **rx11** | `rx11.jpg` | Mrs. Shahana Begum (58F, eGFR 26) | Jardiance 10 + Trajenta 5 | **SGLT2-inhibitor initiation ceiling** when eGFR <30 mL/min | **HIGH** |
| **rx12** | `rx12.jpg` | Al-Haj Anwar Hossain (65M, Stent) | Lopirel 75 + Seclo 20 (Omeprazole) | **CYP2C19 competitive inhibition** reducing Clopidogrel efficacy | **HIGH** |
| **rx13** | `rx13.jpg` | Abul Kashem Molla (53M, Gout) | Uricon 100 + Lasix 40 + D-Cof Syrup | **Loop diuretic urate retention** precipitating acute gout flare | **MEDIUM** |
| **rx14** | `rx14.jpg` | Advocate Shamsul Alam (68M, PD) | Syndopa 110 + Motigut 10 + Calbo D | **Antiemetic safety validation** (Domperidone vs Metoclopramide) | **LOW** |
| **rx15** | `rx15.jpg` | Mst. Farida Yasmin (34F, Post-Op) | Cef-3 200 + Napa 500 + Maxpro 20 | **Standard clean post-operative oral regimen** (Baseline negative) | **LOW** |

---

## 🔬 How to Run the Evaluation Benchmark

Run evaluation with:
```bash
python eval/eval_extraction.py eval/ground_truth.json --votes 1
```
