"""Database initialization and master data seeding for PredictRx-AI."""

from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.clinical_evidence import ClinicalEvidence
from app.models.drug import BDDrugCatalog
from app.models.interaction import DrugInteractionMatrix
from app.models.patient import Patient, PatientClinicalProfile
from app.models.user import User

logger = get_logger("app.db.init_db")


def seed_users(db: Session) -> None:
    """Seed initial clinical users if none exist."""
    admin_email = "doctor@predictrx.bd"
    existing = db.execute(select(User).where(User.email == admin_email)).scalar_one_or_none()
    if not existing:
        logger.info(f"Seeding default clinician user: {admin_email}")
        user = User(
            email=admin_email,
            hashed_password=get_password_hash("Doctor123!"),
            full_name="Dr. Rafiqul Islam",
            role="doctor",
            bmdc_number="A-45892",
            department="Internal Medicine & Nephrology",
            is_active=True,
        )
        db.add(user)

        pharmacist = User(
            email="pharmacist@predictrx.bd",
            hashed_password=get_password_hash("Pharma123!"),
            full_name="Tahrima Sultana, M.Pharm",
            role="clinical_pharmacist",
            department="Clinical Pharmacy & Pharmacovigilance",
            is_active=True,
        )
        db.add(pharmacist)
        db.commit()


def seed_patients(db: Session) -> None:
    """Seed benchmark clinical test patients."""
    patients_data = [
        {
            "mrn": "PRX-2026-0001",
            "full_name": "Mohammad Abdul Karim",
            "age": 68,
            "gender": "male",
            "weight_kg": 64.0,
            "height_cm": 165.0,
            "phone": "+8801711000001",
            "address": "Dhanmondi, Dhaka-1205",
            "profile": {
                "egfr": 28.5,
                "serum_creatinine": 2.4,
                "alt": 32.0,
                "ast": 28.0,
                "chronic_conditions": ["CKD Stage 4", "Hypertension", "Type 2 Diabetes"],
                "known_allergies": ["Penicillin"],
                "is_pregnant": False,
                "is_lactating": False,
                "smoking_status": "former",
            },
        },
        {
            "mrn": "PRX-2026-0002",
            "full_name": "Begum Rokeya Sultana",
            "age": 54,
            "gender": "female",
            "weight_kg": 58.0,
            "height_cm": 155.0,
            "phone": "+8801811000002",
            "address": "Gulshan-2, Dhaka-1212",
            "profile": {
                "egfr": 86.0,
                "serum_creatinine": 0.8,
                "alt": 22.0,
                "ast": 24.0,
                "chronic_conditions": ["Essential Hypertension", "Dyslipidemia"],
                "known_allergies": [],
                "is_pregnant": False,
                "is_lactating": False,
                "smoking_status": "never",
            },
        },
        {
            "mrn": "PRX-2026-0003",
            "full_name": "Fatema Khatun",
            "age": 29,
            "gender": "female",
            "weight_kg": 52.0,
            "height_cm": 158.0,
            "phone": "+8801911000003",
            "address": "Uttara Sector 4, Dhaka-1230",
            "profile": {
                "egfr": 110.0,
                "serum_creatinine": 0.7,
                "alt": 18.0,
                "ast": 20.0,
                "chronic_conditions": [],
                "known_allergies": ["Sulfonamides"],
                "is_pregnant": True,
                "is_lactating": False,
                "smoking_status": "never",
            },
        },
    ]

    for p_info in patients_data:
        existing = db.execute(select(Patient).where(Patient.mrn == p_info["mrn"])).scalar_one_or_none()
        if not existing:
            profile_data = p_info.pop("profile")
            patient = Patient(**p_info)
            db.add(patient)
            db.flush()

            clinical_profile = PatientClinicalProfile(
                patient_id=patient.id,
                **profile_data,
            )
            db.add(clinical_profile)
    db.commit()


def seed_bd_drugs(db: Session) -> None:
    """Seed DGDA Bangladesh brand-to-generic drug catalog."""
    drugs = [
        # Analgesics / Antipyretics
        {
            "brand_name": "Napa",
            "generic_name": "Paracetamol",
            "strength": "500 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "025-055-067",
            "manufacturer": "Beximco Pharmaceuticals Ltd.",
            "therapeutic_class": "Analgesic & Antipyretic",
            "indications": ["Fever", "Mild to moderate pain", "Headache"],
            "adult_dose_standard": "500mg-1000mg every 4-6 hours (max 4000mg/day)",
            "max_daily_dose_mg": 4000.0,
            "contraindications": ["Severe hepatic failure"],
            "renal_dose_adjustment": "No dose adjustment required for mild renal impairment.",
            "hepatic_dose_adjustment": "Reduce dose to max 2000mg-3000mg/day or avoid in severe hepatic impairment.",
        },
        {
            "brand_name": "Napa Extend",
            "generic_name": "Paracetamol",
            "strength": "665 mg",
            "dosage_form": "Extended Release Tablet",
            "dgda_dar": "025-450-067",
            "manufacturer": "Beximco Pharmaceuticals Ltd.",
            "therapeutic_class": "Analgesic & Antipyretic",
            "indications": ["Osteoarthritis pain", "Backache", "Joint pain"],
            "adult_dose_standard": "1330 mg (2 tablets) every 8 hours (max 3990 mg/day)",
            "max_daily_dose_mg": 3990.0,
            "contraindications": ["Severe hepatic impairment"],
            "renal_dose_adjustment": "Extend dosing interval in severe renal impairment.",
            "hepatic_dose_adjustment": "Reduce daily dose; avoid in decompensated cirrhosis.",
        },
        {
            "brand_name": "Ace",
            "generic_name": "Paracetamol",
            "strength": "500 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "012-101-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "Analgesic & Antipyretic",
            "indications": ["Fever", "Headache", "Body ache"],
            "adult_dose_standard": "500mg-1000mg every 4-6 hours",
            "max_daily_dose_mg": 4000.0,
            "contraindications": ["Severe active hepatic disease"],
            "renal_dose_adjustment": "Standard precautions.",
            "hepatic_dose_adjustment": "Dose reduction in hepatic cirrhosis.",
        },
        # NSAIDs
        {
            "brand_name": "Rolac",
            "generic_name": "Ketorolac Tromethamine",
            "strength": "10 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "012-320-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "Non-Steroidal Anti-Inflammatory Drug (NSAID)",
            "indications": ["Short-term management of moderate to severe acute postoperative pain"],
            "adult_dose_standard": "10 mg every 4-6 hours as needed (max 40 mg/day)",
            "max_daily_dose_mg": 40.0,
            "contraindications": [
                "Active peptic ulcer disease",
                "Advanced renal impairment (eGFR < 30)",
                "Pregnancy (3rd trimester)",
                "Concomitant other NSAIDs or Aspirin",
                "Duration exceeding 5 days",
            ],
            "renal_dose_adjustment": "Contraindicated in moderate-to-severe renal impairment or at risk for renal failure due to volume depletion.",
            "hepatic_dose_adjustment": "Use with extreme caution.",
        },
        {
            "brand_name": "Torax",
            "generic_name": "Ketorolac Tromethamine",
            "strength": "10 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "038-142-012",
            "manufacturer": "Incepta Pharmaceuticals Ltd.",
            "therapeutic_class": "NSAID",
            "indications": ["Acute moderate-to-severe pain"],
            "adult_dose_standard": "10 mg every 4-6 hours (max 5 days total)",
            "max_daily_dose_mg": 40.0,
            "contraindications": ["Peptic ulcer", "GI hemorrhage", "Renal failure", "Duration > 5 days"],
            "renal_dose_adjustment": "Contraindicated in advanced renal impairment.",
            "hepatic_dose_adjustment": "Caution advised.",
        },
        # Antiplatelet
        {
            "brand_name": "Ecospirin",
            "generic_name": "Aspirin",
            "strength": "75 mg",
            "dosage_form": "Enteric Coated Tablet",
            "dgda_dar": "012-198-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "Antiplatelet Agent",
            "indications": ["Secondary prevention of cardiovascular events", "Ischemic stroke prevention"],
            "adult_dose_standard": "75 mg - 150 mg once daily",
            "max_daily_dose_mg": 300.0,
            "contraindications": ["Active bleeding", "Hemophilia", "Severe thrombocytopenia", "Age < 16 (Reye syndrome)"],
            "renal_dose_adjustment": "Avoid in severe renal impairment (eGFR < 10).",
            "hepatic_dose_adjustment": "Avoid in severe hepatic failure.",
        },
        # PPIs
        {
            "brand_name": "Sergel",
            "generic_name": "Esomeprazole",
            "strength": "20 mg",
            "dosage_form": "Capsule",
            "dgda_dar": "044-010-098",
            "manufacturer": "Healthcare Pharmaceuticals Ltd.",
            "therapeutic_class": "Proton Pump Inhibitor (PPI)",
            "indications": ["GERD", "Erosive esophagitis", "NSAID-induced ulcer prevention", "H. pylori eradication"],
            "adult_dose_standard": "20 mg - 40 mg once daily before meals",
            "max_daily_dose_mg": 80.0,
            "contraindications": ["Hypersensitivity to substituted benzimidazoles"],
            "renal_dose_adjustment": "No dosage adjustment needed.",
            "hepatic_dose_adjustment": "Maximum 20 mg/day in severe hepatic impairment (Child-Pugh C).",
        },
        {
            "brand_name": "Maxpro",
            "generic_name": "Esomeprazole",
            "strength": "20 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "012-512-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "Proton Pump Inhibitor (PPI)",
            "indications": ["GERD", "Peptic ulcer disease"],
            "adult_dose_standard": "20 mg - 40 mg once daily",
            "max_daily_dose_mg": 80.0,
            "contraindications": ["Hypersensitivity to esomeprazole"],
            "renal_dose_adjustment": "No dose adjustment required.",
            "hepatic_dose_adjustment": "Max 20 mg daily in severe hepatic impairment.",
        },
        {
            "brand_name": "Seclo",
            "generic_name": "Omeprazole",
            "strength": "20 mg",
            "dosage_form": "Capsule",
            "dgda_dar": "012-005-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "Proton Pump Inhibitor (PPI)",
            "indications": ["Duodenal ulcer", "Gastric ulcer", "GERD"],
            "adult_dose_standard": "20 mg - 40 mg once daily",
            "max_daily_dose_mg": 80.0,
            "contraindications": ["Concomitant nelfinavir administration"],
            "renal_dose_adjustment": "No dose adjustment needed.",
            "hepatic_dose_adjustment": "10-20 mg daily in patients with impaired liver function.",
        },
        # Antihypertensives / ARB / ACEi
        {
            "brand_name": "Bizoran",
            "generic_name": "Amlodipine + Olmesartan",
            "strength": "5 mg / 20 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "012-880-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "Antihypertensive Combination (CCB + ARB)",
            "indications": ["Essential Hypertension"],
            "adult_dose_standard": "1 tablet once daily",
            "max_daily_dose_mg": 10.0,
            "contraindications": ["Pregnancy (2nd and 3rd trimesters - fetotoxicity)", "Bilateral renal artery stenosis"],
            "renal_dose_adjustment": "Monitor serum creatinine and potassium closely in renal impairment.",
            "hepatic_dose_adjustment": "Titrate amlodipine carefully.",
        },
        {
            "brand_name": "Ramiril",
            "generic_name": "Ramipril",
            "strength": "5 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "012-610-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "ACE Inhibitor",
            "indications": ["Hypertension", "Congestive Heart Failure", "Post-MI nephropathy"],
            "adult_dose_standard": "2.5 mg - 10 mg once daily",
            "max_daily_dose_mg": 10.0,
            "contraindications": ["History of ACEi angioedema", "Pregnancy", "Concomitant sacubitril/valsartan"],
            "renal_dose_adjustment": "Initial dose 1.25 mg daily if CrCl < 40 mL/min; max 5 mg daily.",
            "hepatic_dose_adjustment": "Close monitoring required.",
        },
        # Diuretic
        {
            "brand_name": "Lasix",
            "generic_name": "Furosemide",
            "strength": "40 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "008-012-001",
            "manufacturer": "Sanofi Bangladesh Ltd.",
            "therapeutic_class": "Loop Diuretic",
            "indications": ["Edema associated with heart failure, cirrhosis, renal disease", "Hypertension"],
            "adult_dose_standard": "20 mg - 80 mg daily",
            "max_daily_dose_mg": 600.0,
            "contraindications": ["Anuria", "Hypovolemia or dehydration", "Severe electrolyte depletion"],
            "renal_dose_adjustment": "Higher doses may be required in severe renal insufficiency; monitor eGFR.",
            "hepatic_dose_adjustment": "Monitor electrolyte balance to prevent hepatic encephalopathy.",
        },
        # Antihistamine
        {
            "brand_name": "Fexo",
            "generic_name": "Fexofenadine",
            "strength": "120 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "012-701-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "Second-Generation Antihistamine",
            "indications": ["Allergic rhinitis", "Chronic idiopathic urticaria"],
            "adult_dose_standard": "120 mg - 180 mg once daily",
            "max_daily_dose_mg": 180.0,
            "contraindications": ["Hypersensitivity"],
            "renal_dose_adjustment": "Recommended starting dose 60 mg once daily if renal impairment.",
            "hepatic_dose_adjustment": "No dose adjustment required.",
        },
        # Antibiotics
        {
            "brand_name": "Zimax",
            "generic_name": "Azithromycin",
            "strength": "500 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "012-402-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "Macrolide Antibiotic",
            "indications": ["Community-acquired pneumonia", "Acute bacterial sinusitis", "Skin infections"],
            "adult_dose_standard": "500 mg once daily for 3-5 days (max 1500mg total course)",
            "max_daily_dose_mg": 500.0,
            "contraindications": ["History of cholestatic jaundice/hepatic dysfunction with azithromycin"],
            "renal_dose_adjustment": "Use caution if eGFR < 10 mL/min.",
            "hepatic_dose_adjustment": "Use with caution in moderate to severe liver disease.",
        },
        {
            "brand_name": "Ciprocin",
            "generic_name": "Ciprofloxacin",
            "strength": "500 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "012-075-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "Fluoroquinolone Antibiotic",
            "indications": ["Urinary tract infections", "Intra-abdominal infections", "Infectious diarrhea"],
            "adult_dose_standard": "250 mg - 750 mg every 12 hours",
            "max_daily_dose_mg": 1500.0,
            "contraindications": ["Concurrent administration of tizanidine", "Myasthenia gravis"],
            "renal_dose_adjustment": "CrCl 30-50 mL/min: 250-500mg q12h; CrCl < 30 mL/min: 250-500mg q18-24h.",
            "hepatic_dose_adjustment": "No adjustment required.",
        },
        {
            "brand_name": "Filmet",
            "generic_name": "Metronidazole",
            "strength": "400 mg",
            "dosage_form": "Tablet",
            "dgda_dar": "012-022-045",
            "manufacturer": "Square Pharmaceuticals PLC",
            "therapeutic_class": "Nitroimidazole Antimicrobial / Antiprotozoal",
            "indications": ["Amebiasis", "Trichomoniasis", "Anaerobic bacterial infections", "Dental infections"],
            "adult_dose_standard": "400 mg every 8 hours for 7-10 days",
            "max_daily_dose_mg": 2400.0,
            "contraindications": ["First trimester pregnancy in trichomoniasis", "Alcohol consumption (disulfiram-like reaction)"],
            "renal_dose_adjustment": "CrCl < 10 mL/min: administer 50% of standard dose.",
            "hepatic_dose_adjustment": "Reduce dose by 50% in severe hepatic impairment.",
        },
    ]

    for d_data in drugs:
        existing = db.execute(
            select(BDDrugCatalog).where(
                BDDrugCatalog.brand_name == d_data["brand_name"],
                BDDrugCatalog.strength == d_data["strength"],
            )
        ).scalar_one_or_none()
        if not existing:
            drug = BDDrugCatalog(**d_data)
            db.add(drug)
    db.commit()


def seed_interactions(db: Session) -> None:
    """Seed validated clinical drug interaction matrix."""
    interactions = [
        # Triple Whammy: NSAID + ACEi/ARB
        {
            "drug_a_generic": "ketorolac tromethamine",
            "drug_b_generic": "ramipril",
            "severity": "critical",
            "clinical_effect": "Acute Kidney Injury (AKI), reduced antihypertensive efficacy, severe hyperkalemia.",
            "mechanism": "ACE inhibitors dilate the efferent renal arteriole while NSAIDs inhibit prostaglandin-mediated afferent arteriolar vasodilation. The combination causes a sharp drop in intraglomerular filtration pressure.",
            "evidence_level": "A",
            "management_recommendation": "Avoid concurrent use. If pain relief is essential, substitute Ketorolac with Paracetamol (up to 3-4 g/day) or short-term topical analgesics. Monitor serum creatinine and potassium if co-exposure occurred.",
            "is_contraindicated": True,
            "citation_ids": ["KDIGO-2024-AKI", "TRIPLE-WHAMMY-2013"],
        },
        {
            "drug_a_generic": "ketorolac tromethamine",
            "drug_b_generic": "amlodipine + olmesartan",
            "severity": "critical",
            "clinical_effect": "Risk of precipitous drop in eGFR, acute renal failure, and hyperkalemia due to ARB + NSAID interaction.",
            "mechanism": "Olmesartan blunts angiotensin II efferent tone; Ketorolac blocks afferent prostaglandins, compromising renal autoregulation.",
            "evidence_level": "A",
            "management_recommendation": "Discontinue Ketorolac. Recommend Paracetamol as safer alternative for analgesia. Check renal function within 48 hours.",
            "is_contraindicated": True,
            "citation_ids": ["KDIGO-2024-AKI", "TRIPLE-WHAMMY-2013"],
        },
        # NSAID + Aspirin Dual Antiplatelet/Bleed
        {
            "drug_a_generic": "ketorolac tromethamine",
            "drug_b_generic": "aspirin",
            "severity": "critical",
            "clinical_effect": "Synergistic inhibition of platelet COX-1 and gastric mucosal prostaglandins, drastically raising gastrointestinal perforation, ulceration, and catastrophic bleeding.",
            "mechanism": "Both agents competitively bind COX-1; combined use diminishes aspirin cardioprotection while multiplying GI mucosal erosion.",
            "evidence_level": "A",
            "management_recommendation": "Strictly contraindicated by DGDA, BNF, and FDA black box warning. Discontinue Ketorolac immediately.",
            "is_contraindicated": True,
            "citation_ids": ["FDA-KETOROLAC-BBW", "BNF-86-NSAID"],
        },
        # Diuretic + ACEi/ARB
        {
            "drug_a_generic": "furosemide",
            "drug_b_generic": "ramipril",
            "severity": "moderate",
            "clinical_effect": "First-dose hypotension, prerenal azotemia if volume depleted.",
            "mechanism": "Volume contraction from loop diuretic sensitizes patient to ACE-inhibitor-induced vasodilation.",
            "evidence_level": "B",
            "management_recommendation": "Verify patient is euvolemic before initiating. Titrate Ramipril cautiously.",
            "is_contraindicated": False,
            "citation_ids": ["BNF-86-ACEI"],
        },
        # Fluoroquinolone + QT
        {
            "drug_a_generic": "ciprofloxacin",
            "drug_b_generic": "azithromycin",
            "severity": "high",
            "clinical_effect": "Additive prolongation of the QTc interval with potential for Torsades de Pointes arrhythmia.",
            "mechanism": "Both ciprofloxacin and azithromycin block the cardiac hERG potassium channel, delaying ventricular repolarization.",
            "evidence_level": "A",
            "management_recommendation": "Avoid simultaneous dual antibiotic prescription unless specifically indicated by microbial culture and sensitivity. Monitor ECG / QTc interval if co-administered.",
            "is_contraindicated": False,
            "citation_ids": ["AHA-QT-2020", "BNF-86-QT"],
        },
    ]

    for item in interactions:
        existing = db.execute(
            select(DrugInteractionMatrix).where(
                DrugInteractionMatrix.drug_a_generic == item["drug_a_generic"],
                DrugInteractionMatrix.drug_b_generic == item["drug_b_generic"],
            )
        ).scalar_one_or_none()
        if not existing:
            interaction = DrugInteractionMatrix(**item)
            db.add(interaction)
    db.commit()


def seed_clinical_evidence(db: Session) -> None:
    """Seed citation-backed clinical guidelines and evidence references."""
    evidence_list = [
        {
            "title": "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease",
            "publication_type": "guideline",
            "authors": "Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group",
            "journal_or_source": "Kidney International",
            "pmid_or_doi": "38490803",
            "url": "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
            "pub_year": 2024,
            "evidence_level": "A",
            "summary": "Recommends avoiding systemic NSAIDs in patients with eGFR < 30 mL/min/1.73m2 (G4-G5) and using lowest effective dose with close renal monitoring in eGFR 30-59 mL/min/1.73m2 (G3).",
        },
        {
            "title": "Combined use of ACE inhibitors or ARBs, diuretics, and NSAIDs ('Triple Whammy') and risk of acute kidney injury",
            "publication_type": "meta_analysis",
            "authors": "Lapi F, Azoulay L, Yin H, Nessim SJ, Suissa S",
            "journal_or_source": "Canadian Medical Association Journal (CMAJ)",
            "pmid_or_doi": "23315998",
            "url": "https://www.cmaj.ca/content/185/4/E179",
            "pub_year": 2013,
            "evidence_level": "A",
            "summary": "Large population-based cohort study demonstrating that concurrent use of an ACE inhibitor/ARB, diuretic, and NSAID is associated with a 31% increased rate of acute kidney injury, with risk highest during the first 30 days.",
        },
        {
            "title": "Ketorolac Tromethamine - FDA Black Box Warning and Duration Limitations",
            "publication_type": "regulatory_alert",
            "authors": "US Food and Drug Administration / DGDA Bangladesh Safety Advisory",
            "journal_or_source": "FDA Safety Alerts / DGDA Pharmacovigilance Bulletin",
            "pmid_or_doi": "FDA-BBW-KETOROLAC",
            "url": "https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/019645s019lbl.pdf",
            "pub_year": 2023,
            "evidence_level": "A",
            "summary": "Ketorolac is indicated only for the short-term (up to 5 days) management of moderately severe acute pain. Total combined duration of oral, IV, and IM routes must not exceed 5 days due to severe gastrointestinal bleeding and renal failure risk.",
        },
        {
            "title": "American Geriatrics Society 2023 Updated AGS Beers Criteria for Potentially Inappropriate Medication Use in Older Adults",
            "publication_type": "guideline",
            "authors": "The 2023 American Geriatrics Society Beers Criteria Update Expert Panel",
            "journal_or_source": "Journal of the American Geriatrics Society (JAGS)",
            "pmid_or_doi": "37139188",
            "url": "https://agsjournals.onlinelibrary.wiley.com/doi/10.1111/jgs.18372",
            "pub_year": 2023,
            "evidence_level": "A",
            "summary": "NSAIDs should be avoided for chronic use in older adults (age >= 65) due to increased risk of GI bleeding, peptic ulcer disease, heart failure exacerbation, and renal impairment.",
        },
    ]

    for ev_data in evidence_list:
        existing = db.execute(
            select(ClinicalEvidence).where(ClinicalEvidence.title == ev_data["title"])
        ).scalar_one_or_none()
        if not existing:
            ev = ClinicalEvidence(**ev_data)
            db.add(ev)
    db.commit()


def init_db() -> None:
    """Run all master database seeds."""
    db = SessionLocal()
    try:
        logger.info("Starting master database seeding...")
        seed_users(db)
        seed_patients(db)
        seed_bd_drugs(db)
        seed_interactions(db)
        seed_clinical_evidence(db)
        logger.info("Master database seeding completed successfully.")
    except Exception as exc:
        logger.error(f"Error during database initialization: {exc}", exc_info=True)
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
