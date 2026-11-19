import os
import json
from PIL import Image, ImageDraw, ImageFont

DATASET_CASES = [
    {
        "id": "rx01",
        "file": "rx01.jpg",
        "patient_name": "Md. Abdul Karim",
        "age": 62,
        "gender": "Male",
        "weight_kg": 68.0,
        "date": "14/11/2026",
        "doctor": "Prof. Dr. M. A. Wahab, MBBS, FCPS (Nephrology)",
        "clinic": "DHAKA SPECIALIZED KIDNEY & MEDICINE CENTER",
        "reg": "BMDC Reg: A-31294",
        "notes": "Known T2DM, CKD Stage 3 (eGFR 34.5). Low back ache x 2 wks.",
        "medicines": [
            {"brand_name": "Bizoran 5/20", "generic": "Olmesartan + Amlodipine", "dosage_syntax": "1+0+0", "duration_days": 30, "timing": "After Meal", "instruction": "সকালে ভরা পেটে"},
            {"brand_name": "Rolac 10", "generic": "Ketorolac Tromethamine", "dosage_syntax": "1+0+1", "duration_days": 14, "timing": "After Meal", "instruction": "ব্যথার জন্য ১৪ দিন"}
        ],
        "expected_alerts": ["Rolac 5-day ceiling exceeded", "Nephrotoxic clash with ARB in CKD"],
        "risk_tier": "CRITICAL"
    },
    {
        "id": "rx02",
        "file": "rx02.jpg",
        "patient_name": "Begum Rokeya",
        "age": 54,
        "gender": "Female",
        "weight_kg": 64.0,
        "date": "14/11/2026",
        "doctor": "Dr. Farhana Ahmed, MBBS, MD (Cardiology)",
        "clinic": "NATIONAL HEART & HEALTHCARE INSTITUTE",
        "reg": "BMDC Reg: A-42109",
        "notes": "Congestive Heart Failure, Bilateral pedal edema.",
        "medicines": [
            {"brand_name": "Angilock 50", "generic": "Losartan Potassium", "dosage_syntax": "1+0+0", "duration_days": 30, "timing": "After Meal", "instruction": "সকালে ১টি"},
            {"brand_name": "Lasix 40", "generic": "Furosemide", "dosage_syntax": "1+0+0", "duration_days": 30, "timing": "Morning", "instruction": "প্রস্রাব বাড়াতে সকালে ১টি"},
            {"brand_name": "Rolac 10", "generic": "Ketorolac Tromethamine", "dosage_syntax": "1+0+1", "duration_days": 7, "timing": "After Meal", "instruction": "হাঁটুর ব্যথার জন্য ৭ দিন"}
        ],
        "expected_alerts": ["Triple Whammy: ARB + Diuretic + NSAID", "Acute renal hemodynamic collapse risk"],
        "risk_tier": "CRITICAL"
    },
    {
        "id": "rx03",
        "file": "rx03.jpg",
        "patient_name": "Master Ayan",
        "age": 7,
        "gender": "Male",
        "weight_kg": 22.0,
        "date": "15/11/2026",
        "doctor": "Dr. S. K. Saha, MBBS, DCH (Pediatrics)",
        "clinic": "GREEN LIFE PEDIATRIC CLINIC & CHILD CARE",
        "reg": "BMDC Reg: A-51082",
        "notes": "Viral influenza, High fever (103 F), Runny nose, Dry cough.",
        "medicines": [
            {"brand_name": "Ecosprin 75", "generic": "Aspirin", "dosage_syntax": "1+0+0", "duration_days": 5, "timing": "After Meal", "instruction": "জ্বর ও ব্যথার জন্য"},
            {"brand_name": "Ceevit 250", "generic": "Ascorbic Acid", "dosage_syntax": "1+0+1", "duration_days": 7, "timing": "After Meal", "instruction": "চুষে খাওয়ার জন্য"}
        ],
        "expected_alerts": ["Pediatric Aspirin contraindication", "Fatal Reye's syndrome hazard"],
        "risk_tier": "CRITICAL"
    },
    {
        "id": "rx04",
        "file": "rx04.jpg",
        "patient_name": "Haji Nurul Islam",
        "age": 74,
        "gender": "Male",
        "weight_kg": 58.0,
        "date": "15/11/2026",
        "doctor": "Dr. Md. Zahirul Haque, MBBS, FCPS (Geriatric Medicine)",
        "clinic": "BIRDEM GERIATRIC CARE UNIT",
        "reg": "BMDC Reg: A-28941",
        "notes": "Elderly Type 2 Diabetes, frequent dizziness, borderline renal status.",
        "medicines": [
            {"brand_name": "Glibenclamide 5", "generic": "Glibenclamide", "dosage_syntax": "1+0+0", "duration_days": 30, "timing": "Before Meal", "instruction": "সকালে নাস্তার পূর্বে"},
            {"brand_name": "Metfo 850", "generic": "Metformin HCl", "dosage_syntax": "1+0+1", "duration_days": 30, "timing": "After Meal", "instruction": "ভরা পেটে"},
            {"brand_name": "Napa 500", "generic": "Paracetamol", "dosage_syntax": "1+1+1", "duration_days": 5, "timing": "After Meal", "instruction": "মাথাব্যথার জন্য"}
        ],
        "expected_alerts": ["Sulfonylurea (Glibenclamide) severe hypoglycemia warning in age >70"],
        "risk_tier": "HIGH"
    },
    {
        "id": "rx05",
        "file": "rx05.jpg",
        "patient_name": "Mrs. Nasreen Akter",
        "age": 28,
        "gender": "Female",
        "weight_kg": 56.0,
        "date": "15/11/2026",
        "doctor": "Dr. Rubina Parvin, MBBS, FCPS (Obs & Gynae)",
        "clinic": "CARE MATERNITY & INFERTILITY CLINIC",
        "reg": "BMDC Reg: A-37142",
        "notes": "Gravida 1, 10 weeks pregnancy. Severe burning micturition (UTI).",
        "medicines": [
            {"brand_name": "Ciprocin 500", "generic": "Ciprofloxacin", "dosage_syntax": "1+0+1", "duration_days": 7, "timing": "After Meal", "instruction": "ইনফেকশনের জন্য ১২ ঘণ্টা পর পর"},
            {"brand_name": "Seclo 20", "generic": "Omeprazole", "dosage_syntax": "1+0+1", "duration_days": 14, "timing": "Before Meal", "instruction": "খাবারের ৩০ মি. আগে"}
        ],
        "expected_alerts": ["Fluoroquinolone (Ciprofloxacin) strictly contraindicated in pregnancy 1st trimester (cartilage toxicity)"],
        "risk_tier": "CRITICAL"
    },
    {
        "id": "rx06",
        "file": "rx06.jpg",
        "patient_name": "Kazi Mahfuzur Rahman",
        "age": 45,
        "gender": "Male",
        "weight_kg": 72.0,
        "date": "15/11/2026",
        "doctor": "Dr. T. I. Choudhury, MBBS, MD (Gastroenterology)",
        "clinic": "POPULAR DIAGNOSTIC & GASTRO CLINIC",
        "reg": "BMDC Reg: A-33981",
        "notes": "History of bleeding duodenal ulcer 2 months ago. Neck spasm.",
        "medicines": [
            {"brand_name": "Aceclofenac 100", "generic": "Aceclofenac", "dosage_syntax": "1+0+1", "duration_days": 10, "timing": "After Meal", "instruction": "ঘাড়ের ব্যথার জন্য"},
            {"brand_name": "Pantobex 20", "generic": "Pantoprazole", "dosage_syntax": "1+0+1", "duration_days": 14, "timing": "Before Meal", "instruction": "সকাল-রাত খাবারের আগে"}
        ],
        "expected_alerts": ["Non-selective NSAID (Aceclofenac) high ulcer recurrence & GI hemorrhage risk"],
        "risk_tier": "HIGH"
    },
    {
        "id": "rx07",
        "file": "rx07.jpg",
        "patient_name": "Jannatul Ferdous",
        "age": 36,
        "gender": "Female",
        "weight_kg": 52.0,
        "date": "16/11/2026",
        "doctor": "Dr. K. A. Mannan, MBBS, FCPS (Chest & Pulmonology)",
        "clinic": "MEDINUR RESPIRATORY CARE CENTER",
        "reg": "BMDC Reg: A-45210",
        "notes": "Chronic Bronchial Asthma on inhaler. Performance anxiety & palpitations.",
        "medicines": [
            {"brand_name": "Indever 40", "generic": "Propranolol", "dosage_syntax": "1+0+1", "duration_days": 15, "timing": "After Meal", "instruction": "বুক ধড়ফড়ের জন্য"},
            {"brand_name": "Napa Extend 665", "generic": "Paracetamol", "dosage_syntax": "1+0+1", "duration_days": 5, "timing": "After Meal", "instruction": "জ্বরের জন্য"}
        ],
        "expected_alerts": ["Non-selective Beta-Blocker (Propranolol) contraindicated in Asthma (fatal bronchospasm hazard)"],
        "risk_tier": "CRITICAL"
    },
    {
        "id": "rx08",
        "file": "rx08.jpg",
        "patient_name": "Solaiman Shikdar",
        "age": 52,
        "gender": "Male",
        "weight_kg": 65.0,
        "date": "16/11/2026",
        "doctor": "Dr. M. S. Alam, MBBS, FCPS (Hepatology)",
        "clinic": "BANGLADESH LIVER FOUNDATION CLINIC",
        "reg": "BMDC Reg: A-39044",
        "notes": "Chronic Liver Disease (Child-Pugh B), Bilirubin 3.2, severe generalized body pain.",
        "medicines": [
            {"brand_name": "Napa 500", "generic": "Paracetamol", "dosage_syntax": "2+2+2", "duration_days": 10, "timing": "After Meal", "instruction": "২টি করে দিনে ৩ বার (3000mg/day)!"},
            {"brand_name": "Urso 300", "generic": "Ursodeoxycholic Acid", "dosage_syntax": "1+0+1", "duration_days": 30, "timing": "After Meal", "instruction": "খাবারের সাথে"}
        ],
        "expected_alerts": ["High-dose Paracetamol toxicity warning in hepatic impairment / cirrhosis"],
        "risk_tier": "HIGH"
    },
    {
        "id": "rx09",
        "file": "rx09.jpg",
        "patient_name": "Md. Rafiqul Islam",
        "age": 60,
        "gender": "Male",
        "weight_kg": 76.0,
        "date": "16/11/2026",
        "doctor": "Dr. Shahinur Rashid, MBBS, MD (Internal Medicine)",
        "clinic": "SQUARE OUTPATIENT HEALTH NETWORK",
        "reg": "BMDC Reg: A-41872",
        "notes": "Uncontrolled Stage 2 Hypertension (BP 175/105 mmHg), severe nasal congestion.",
        "medicines": [
            {"brand_name": "Norvask 5", "generic": "Amlodipine Besylate", "dosage_syntax": "1+0+0", "duration_days": 30, "timing": "Morning", "instruction": "সকালে ১টি"},
            {"brand_name": "Rhinil", "generic": "Pseudoephedrine + Chlorpheniramine", "dosage_syntax": "1+0+1", "duration_days": 7, "timing": "After Meal", "instruction": "সর্দি ও বন্ধ নাকের জন্য"}
        ],
        "expected_alerts": ["Systemic Sympathomimetic Decongestant exacerbates severe uncontrolled hypertension"],
        "risk_tier": "MEDIUM"
    },
    {
        "id": "rx10",
        "file": "rx10.jpg",
        "patient_name": "Baby Samia",
        "age": 3,
        "gender": "Female",
        "weight_kg": 13.5,
        "date": "16/11/2026",
        "doctor": "Dr. Anisur Rahman, MBBS, DCH (Pediatrics)",
        "clinic": "DHAKA SHISHU MATRI HEALTH CENTER",
        "reg": "BMDC Reg: A-52319",
        "notes": "Acute Otitis Media, ear discharge, irritability, low fever.",
        "medicines": [
            {"brand_name": "Moxaclav 156 Susp", "generic": "Amoxicillin + Clavulanic Acid", "dosage_syntax": "1+1+1", "duration_days": 7, "timing": "After Meal", "instruction": "১ চামচ করে দিনে ৩ বার"},
            {"brand_name": "Tofen Syrup", "generic": "Ketotifen", "dosage_syntax": "1+0+1", "duration_days": 5, "timing": "After Meal", "instruction": "আধা চামচ রাতে ও সকালে"}
        ],
        "expected_alerts": ["Safe pediatric regimen, verify weight-based antibiotic dosing (45mg/kg/day)"],
        "risk_tier": "LOW"
    },
    {
        "id": "rx11",
        "file": "rx11.jpg",
        "patient_name": "Mrs. Shahana Begum",
        "age": 58,
        "gender": "Female",
        "weight_kg": 62.0,
        "date": "16/11/2026",
        "doctor": "Prof. Dr. Harun-Or-Rashid, MBBS, FCPS (Endocrinology)",
        "clinic": "BIRDEM HOSPITAL SPECIALIST OPD",
        "reg": "BMDC Reg: A-24150",
        "notes": "Diabetic Kidney Disease Stage 4 (eGFR 26 mL/min). Uncontrolled HbA1c 9.2%.",
        "medicines": [
            {"brand_name": "Jardiance 10", "generic": "Empagliflozin", "dosage_syntax": "1+0+0", "duration_days": 30, "timing": "Morning", "instruction": "সকালে ১টি"},
            {"brand_name": "Trajenta 5", "generic": "Linagliptin", "dosage_syntax": "1+0+0", "duration_days": 30, "timing": "After Meal", "instruction": "দুপুরে ১টি"}
        ],
        "expected_alerts": ["SGLT2-Inhibitor (Empagliflozin) initiation restriction when eGFR <30 mL/min"],
        "risk_tier": "HIGH"
    },
    {
        "id": "rx12",
        "file": "rx12.jpg",
        "patient_name": "Al-Haj Anwar Hossain",
        "age": 65,
        "gender": "Male",
        "weight_kg": 70.0,
        "date": "16/11/2026",
        "doctor": "Dr. K. M. Saifullah, MBBS, FCPS, MD (Cardiology)",
        "clinic": "UNITED HOSPITAL CARDIOLOGY SUITE",
        "reg": "BMDC Reg: A-38910",
        "notes": "Post-PCI drug-eluting stent (3 weeks ago). Heartburn and acid reflux.",
        "medicines": [
            {"brand_name": "Lopirel 75", "generic": "Clopidogrel", "dosage_syntax": "1+0+0", "duration_days": 30, "timing": "After Meal", "instruction": "রক্ত তরল রাখার জন্য সকালে ১টি"},
            {"brand_name": "Seclo 20", "generic": "Omeprazole", "dosage_syntax": "1+0+1", "duration_days": 30, "timing": "Before Meal", "instruction": "গ্যাসের জন্য সকাল-রাত"},
            {"brand_name": "Rosuva 10", "generic": "Rosuvastatin", "dosage_syntax": "0+0+1", "duration_days": 30, "timing": "Night", "instruction": "রাতে ১টি"}
        ],
        "expected_alerts": ["Omeprazole CYP2C19 competitive inhibition reduces Clopidogrel antiplatelet activation -> Stent thrombosis hazard"],
        "risk_tier": "HIGH"
    },
    {
        "id": "rx13",
        "file": "rx13.jpg",
        "patient_name": "Abul Kashem Molla",
        "age": 53,
        "gender": "Male",
        "weight_kg": 78.0,
        "date": "16/11/2026",
        "doctor": "Dr. Nargis Sultana, MBBS, FCPS (Rheumatology)",
        "clinic": "DHAKA ARTHRITIS & PAIN CLINICAL CARE",
        "reg": "BMDC Reg: A-43092",
        "notes": "Acute Gouty Arthritis of right 1st MTP joint. Serum Uric Acid 9.8 mg/dL.",
        "medicines": [
            {"brand_name": "Uricon 100", "generic": "Allopurinol", "dosage_syntax": "1+0+0", "duration_days": 30, "timing": "After Meal", "instruction": "ইউরিক এসিড কমাতে"},
            {"brand_name": "Lasix 40", "generic": "Furosemide", "dosage_syntax": "1+0+0", "duration_days": 15, "timing": "Morning", "instruction": "সকালে ১টি"},
            {"brand_name": "D-Cof Syrup", "generic": "Dextromethorphan + Guaifenesin", "dosage_syntax": "1+1+1", "duration_days": 5, "timing": "After Meal", "instruction": "কাশির জন্য"}
        ],
        "expected_alerts": ["Loop Diuretic (Furosemide) impairs renal urate excretion, precipitating severe gout flare-up"],
        "risk_tier": "MEDIUM"
    },
    {
        "id": "rx14",
        "file": "rx14.jpg",
        "patient_name": "Advocate Shamsul Alam",
        "age": 68,
        "gender": "Male",
        "weight_kg": 63.0,
        "date": "16/11/2026",
        "doctor": "Prof. Dr. M. S. Laskar, MBBS, PhD (Neurology)",
        "clinic": "BANGABANDHU SHEIKH MUJIB MEDICAL UNIVERSITY (BSMMU)",
        "reg": "BMDC Reg: A-21980",
        "notes": "Parkinson's Disease (resting tremor & rigidity), frequent nausea & dyspepsia.",
        "medicines": [
            {"brand_name": "Syndopa 110", "generic": "Levodopa + Carbidopa", "dosage_syntax": "1+1+1", "duration_days": 30, "timing": "Before Meal", "instruction": "খাবারের আধা ঘণ্টা আগে"},
            {"brand_name": "Motigut 10", "generic": "Domperidone", "dosage_syntax": "1+0+1", "duration_days": 10, "timing": "Before Meal", "instruction": "বমির ভাব কমাতে"},
            {"brand_name": "Calbo D", "generic": "Calcium + Vitamin D3", "dosage_syntax": "1+0+0", "duration_days": 30, "timing": "After Meal", "instruction": "দুপুরে ভরা পেটে"}
        ],
        "expected_alerts": ["Safe antiemetic choice (Domperidone does not cross BBB; verify avoidance of Metoclopramide)"],
        "risk_tier": "LOW"
    },
    {
        "id": "rx15",
        "file": "rx15.jpg",
        "patient_name": "Mst. Farida Yasmin",
        "age": 34,
        "gender": "Female",
        "weight_kg": 55.0,
        "date": "16/11/2026",
        "doctor": "Dr. Tarek Hossain, MBBS, FCPS (General Surgery)",
        "clinic": "DHAKA COMMUNITY MEDICAL COLLEGE HOSPITAL",
        "reg": "BMDC Reg: A-46129",
        "notes": "Post-laparoscopic appendectomy Day 3. Wounds healing well, minimal pain.",
        "medicines": [
            {"brand_name": "Cef-3 200", "generic": "Cefixime Trihydrate", "dosage_syntax": "1+0+1", "duration_days": 7, "timing": "After Meal", "instruction": "সকাল ও রাতে খাবার পর"},
            {"brand_name": "Napa 500", "generic": "Paracetamol", "dosage_syntax": "1+1+1", "duration_days": 5, "timing": "After Meal", "instruction": "ব্যথা থাকলে খাবেন"},
            {"brand_name": "Maxpro 20", "generic": "Esomeprazole", "dosage_syntax": "1+0+1", "duration_days": 14, "timing": "Before Meal", "instruction": "খাবারের ৩০ মি. পূর্বে"}
        ],
        "expected_alerts": ["Standard clean post-operative oral regimen - No contraindications detected"],
        "risk_tier": "LOW"
    }
]

def render_prescription_image(case, output_path):
    # Create high-res medical prescription canvas (1200 x 1600 px)
    width, height = 1200, 1600
    img = Image.new("RGB", (width, height), color="#FBFBFC")
    draw = ImageDraw.Draw(img)

    # Fonts
    try:
        font_clinic = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 36)
        font_clinic_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 20)
        font_doc = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26)
        font_doc_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 19)
        font_label = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 21)
        font_text = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 21)
        font_rx = ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 52)
        font_med_brand = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 28)
        font_med_detail = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 22)
        font_footer = ImageFont.truetype("C:/Windows/Fonts/segoeuii.ttf", 18)
    except Exception:
        font_clinic = font_doc = font_med_brand = font_rx = ImageFont.load_default()
        font_clinic_sub = font_doc_sub = font_label = font_text = font_med_detail = font_footer = font_clinic

    # Clean border
    draw.rectangle([(25, 25), (width - 25, height - 25)], outline="#CBD5E1", width=3)
    draw.rectangle([(29, 29), (width - 29, height - 29)], outline="#E2E8F0", width=1)

    # Header Bar
    draw.rectangle([(30, 30), (width - 30, 160)], fill="#0F172A")
    draw.text((60, 48), case["clinic"], fill="#38BDF8", font=font_clinic)
    draw.text((60, 98), "24/7 EMERGENCY & ADVANCED CLINICAL CARE • DHAKA, BANGLADESH", fill="#94A3B8", font=font_clinic_sub)
    draw.text((60, 124), "Hotline: +880 2 9876543 • info@healthcare-bd.org", fill="#64748B", font=font_clinic_sub)

    # Doctor Section
    draw.text((60, 185), case["doctor"], fill="#0F172A", font=font_doc)
    draw.text((60, 220), case["reg"], fill="#475569", font=font_doc_sub)
    draw.text((60, 246), "Consultant Physician & Specialist", fill="#64748B", font=font_doc_sub)

    draw.line([(width - 320, 185), (width - 320, 280)], fill="#E2E8F0", width=2)
    draw.text((width - 300, 195), "Date of Issue:", fill="#64748B", font=font_label)
    draw.text((width - 300, 225), case["date"], fill="#0F172A", font=font_doc)

    # Patient Details Strip
    draw.rectangle([(50, 290), (width - 50, 365)], fill="#F1F5F9", outline="#E2E8F0", width=1)
    
    draw.text((70, 305), "Patient Name:", fill="#475569", font=font_label)
    draw.text((215, 305), case["patient_name"], fill="#0F172A", font=font_label)

    draw.text((620, 305), "Age:", fill="#475569", font=font_label)
    draw.text((675, 305), f"{case['age']} Yrs", fill="#0F172A", font=font_label)

    draw.text((800, 305), "Gender:", fill="#475569", font=font_label)
    draw.text((890, 305), case["gender"], fill="#0F172A", font=font_label)

    draw.text((1010, 305), "Weight:", fill="#475569", font=font_label)
    draw.text((1095, 305), f"{case['weight_kg']} kg", fill="#0F172A", font=font_label)

    # Clinical Notes Line
    draw.text((70, 335), "Clinical Notes:", fill="#64748B", font=font_text)
    draw.text((215, 335), case["notes"], fill="#334155", font=font_text)

    # Left Column (Vitals & Clinical signs) and Right Column (Rx)
    draw.line([(320, 385), (320, 1420)], fill="#E2E8F0", width=2)

    # Left Column info
    draw.text((60, 395), "CLINICAL EVALUATION", fill="#0F172A", font=font_label)
    draw.text((60, 435), "BP:", fill="#64748B", font=font_text)
    draw.text((110, 435), "130/85 mmHg", fill="#0F172A", font=font_text)
    draw.text((60, 470), "Pulse:", fill="#64748B", font=font_text)
    draw.text((130, 470), "78 bpm", fill="#0F172A", font=font_text)
    draw.text((60, 505), "Temp:", fill="#64748B", font=font_text)
    draw.text((130, 505), "98.6 F", fill="#0F172A", font=font_text)
    draw.text((60, 540), "SPO2:", fill="#64748B", font=font_text)
    draw.text((130, 540), "99%", fill="#0F172A", font=font_text)

    draw.line([(60, 580), (300, 580)], fill="#E2E8F0", width=1)
    draw.text((60, 600), "DIAGNOSIS:", fill="#0F172A", font=font_label)
    # Wrap diagnosis
    words = case["notes"].split(",")
    y_diag = 635
    for w in words[:3]:
        draw.text((60, y_diag), f"• {w.strip()}", fill="#475569", font=font_text)
        y_diag += 32

    # Right Column: Rx Symbol & Medicines
    draw.text((360, 390), "℞", fill="#0284C7", font=font_rx)

    y_med = 480
    for idx, med in enumerate(case["medicines"], 1):
        # Med index & brand
        draw.text((370, y_med), f"{idx}. Tab/Cap {med['brand_name']}", fill="#0F172A", font=font_med_brand)
        
        # Generic & Dose schedule
        schedule_text = f"Dose: {med['dosage_syntax']}  •  Duration: {med['duration_days']} Days  •  Timing: {med['timing']}"
        draw.text((400, y_med + 38), schedule_text, fill="#0369A1", font=font_med_detail)
        
        # Bangla / English instructions
        draw.text((400, y_med + 70), f"Instructions: {med['instruction']}", fill="#64748B", font=font_text)
        
        draw.line([(370, y_med + 115), (width - 60, y_med + 115)], fill="#F1F5F9", width=2)
        y_med += 140

    # Doctor Sign & Stamp at Bottom Right
    draw.line([(width - 350, 1400), (width - 70, 1400)], fill="#0F172A", width=2)
    draw.text((width - 320, 1410), "Physician Signature & Seal", fill="#475569", font=font_text)
    draw.text((width - 335, 1440), case["reg"], fill="#64748B", font=font_footer)

    # Footer note
    draw.rectangle([(30, height - 70), (width - 30, height - 30)], fill="#F8FAFC")
    draw.text((50, height - 58), "Validated with PredictRx BD • CDSS Verification Node #482 • Powered by DGDA Formulary 2026", fill="#64748B", font=font_footer)

    img.save(output_path, "JPEG", quality=95)
    print(f"Generated: {output_path} ({os.path.getsize(output_path) / 1024:.1f} KB)")

def main():
    samples_dir = os.path.abspath("ai_engine/samples")
    eval_dir = os.path.abspath("ai_engine/eval")
    os.makedirs(samples_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    print("Generating 15 Golden Test Prescriptions in ai_engine/samples/...")
    ground_truth_cases = []

    for case in DATASET_CASES:
        img_filename = case["file"]
        img_path = os.path.join(samples_dir, img_filename)
        render_prescription_image(case, img_path)

        # Build ground_truth item conforming to eval_extraction.py
        gt_item = {
            "case_id": case["id"],
            "image": f"samples/{img_filename}",
            "patient_name": case["patient_name"],
            "age": case["age"],
            "gender": case["gender"],
            "weight_kg": case["weight_kg"],
            "clinical_notes": case["notes"],
            "medicines": [
                {
                    "brand_name": m["brand_name"],
                    "generic_name": m["generic"],
                    "dosage_syntax": m["dosage_syntax"],
                    "duration_days": m["duration_days"],
                    "timing": m["timing"]
                }
                for m in case["medicines"]
            ],
            "expected_alerts": case["expected_alerts"],
            "risk_tier": case["risk_tier"]
        }
        ground_truth_cases.append(gt_item)

    gt_path = os.path.join(eval_dir, "ground_truth.json")
    print(f"Writing complete 15-case ground truth to: {gt_path}")
    with open(gt_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth_cases, f, indent=2, ensure_ascii=False)

    print(f"Successfully generated 15 test prescriptions and ground truth dataset! ({len(ground_truth_cases)} cases)")

if __name__ == "__main__":
    main()
