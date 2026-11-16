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
    """Seed DGDA Bangladesh brand-to-generic drug catalog (260+ common brands)."""
    from app.db.seeds.bd_drugs_data import BD_DRUGS_SEED_DATA

    count_added = 0
    for d_data in BD_DRUGS_SEED_DATA:
        existing = db.execute(
            select(BDDrugCatalog).where(
                BDDrugCatalog.brand_name == d_data["brand_name"],
                BDDrugCatalog.strength == d_data["strength"],
            )
        ).scalar_one_or_none()
        if not existing:
            drug = BDDrugCatalog(**d_data)
            db.add(drug)
            count_added += 1
    db.commit()
    logger.info(f"Seeded {count_added} new DGDA drugs into catalog (total seed size: {len(BD_DRUGS_SEED_DATA)})")


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
