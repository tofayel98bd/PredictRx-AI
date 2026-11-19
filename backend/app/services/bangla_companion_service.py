"""Bengali patient companion and simplified explanation generator."""

from datetime import datetime
from typing import List, Optional

from app.schemas.analysis import (
    BanglaMedicineInstructionSchema,
    BanglaPatientCompanionSchema,
    PatientContextSchema,
    ValidatedMedicineSchema,
)

DOSE_TO_BANGLA = {
    "1+0+1": "সকালে ১টি ও রাতে ১টি",
    "1+1+1": "সকালে ১টি, দুপুরে ১টি ও রাতে ১টি",
    "1+0+0": "সকালে ১টি",
    "0+0+1": "রাতে ১টি",
    "0+1+0": "দুপুরে ১টি",
    "1+1+1+1": "প্রতি ৬ ঘণ্টা পর পর ১টি (দিনে ৪ বার)",
    "½+0+½": "সকালে অর্ধেক ও রাতে অর্ধেক",
    "1x3": "দিনে ৩ বার ১ চামচ করে",
    "2x3": "দিনে ৩ বার ২ চামচ করে",
    "OD": "প্রতিদিন ১ বার",
    "BD": "প্রতিদিন ২ বার",
    "TDS": "প্রতিদিন ৩ বার",
    "HS": "রাতে শোবার আগে",
    "PRN": "প্রয়োজন হলে",
    "SOS": "জরুরি প্রয়োজনে",
    "STAT": "জরুরি প্রয়োজনে তাৎক্ষণিক এক মাত্রা",
    "stat.": "জরুরি প্রয়োজনে তাৎক্ষণিক এক মাত্রা",
}

GENERIC_PURPOSE_BANGLA = {
    "dextrose": "শরীরে রক্তের সুগার ও তাৎক্ষণিক শক্তি যোগাতে",
    "oral rehydration": "শরীরে পানিশূন্যতা ও ইলেক্ট্রোলাইটের ভারসাম্য বজায় রাখতে",
    "ors": "শরীরে পানিশূন্যতা ও ইলেক্ট্রোলাইটের ভারসাম্য বজায় রাখতে",
    "paracetamol": "জ্বর ও হালকা ব্যথা নিরাময়ে",
    "esomeprazole": "গ্যাস্ট্রিক ও অ্যাসিডিটি নিয়ন্ত্রণে",
    "omeprazole": "পেটের গ্যাস ও আলসারের সুরক্ষায়",
    "aspirin": "রক্ত তরল রাখতে ও হৃদরোগ প্রতিরোধে",
    "ketorolac tromethamine": "তীব্র স্বল্পমেয়াদী ব্যথা কমানোর জন্য",
    "amlodipine + olmesartan": "উচ্চ রক্তচাপ নিয়ন্ত্রণে রাখতে",
    "ramipril": "উচ্চ রক্তচাপ ও কিডনির রক্তনালী সুরক্ষায়",
    "fexofenadine": "অ্যালার্জি, হাঁচি ও সর্দি প্রতিরোধে",
    "montelukast": "শ্বাসকষ্ট ও অ্যালার্জিক হাঁপানি নিয়ন্ত্রণে",
    "azithromycin": "ব্যাকটেরিয়াজনিত জীবাণু সংক্রমণের চিকিৎসায়",
    "ciprofloxacin": "মূত্রনালী বা পেটের সংক্রমণের চিকিৎসায়",
    "metronidazole": "আমাশয় ও পেটের জীবাণু ধ্বংস করতে",
    "furosemide": "শরীরের অতিরিক্ত পানি ও ফোলা ভাব কমাতে",
}


class BanglaCompanionService:
    """Generates patient-centered Bengali explanation leaflets."""

    def generate(
        self,
        patient: PatientContextSchema,
        medications: List[ValidatedMedicineSchema],
        critical_alerts: bool = False,
    ) -> BanglaPatientCompanionSchema:
        med_cards: List[BanglaMedicineInstructionSchema] = []

        for med in medications:
            gen_key = med.generic_name.lower() if med.generic_name else ""
            purpose = "স্বাস্থ্য সুরক্ষার জন্য"
            for k, p in GENERIC_PURPOSE_BANGLA.items():
                if k in gen_key:
                    purpose = p
                    break

            dosage_str = DOSE_TO_BANGLA.get(med.dosage_syntax or "", f"ডাক্তারের নিয়ম অনুযায়ী ({med.dosage_syntax or 'নিয়মিত'})")
            timing_str = "খাবার পরে ভরা পেটে খাবেন" if "after" in (med.timing or "").lower() else "খাবারের ২০ থেকে ৩০ মিনিট আগে খাবেন"

            warnings: List[str] = []
            if "ketorolac" in gen_key:
                warnings.append("এই ওষুধটি ৫ দিনের বেশি খাবেন না। পেট ব্যথা বা বমি ভাব হলে ডাক্তারকে জানান।")
            elif "paracetamol" in gen_key:
                warnings.append("ডাক্তারের পরামর্শের চেয়ে অতিরিক্ত খাবেন না। একই সাথে অন্য প্যারাসিটামল সেবন করবেন না।")
            elif "metronidazole" in gen_key:
                warnings.append("ওষুধ চলাকালীন কোনো ধরনের অ্যালকোহল জাতীয় পানীয় পান করবেন না।")

            duration_bn = f"{med.duration_days} দিন পর্যন্ত" if med.duration_days else "ডাক্তারের পরবর্তী পরামর্শ পর্যন্ত"

            med_cards.append(
                BanglaMedicineInstructionSchema(
                    brand_name=med.brand_name,
                    generic_name=med.generic_name or med.brand_name,
                    bengali_brand_name=med.brand_name,
                    dosage_bengali=dosage_str,
                    timing_bengali=timing_str,
                    duration_bengali=duration_bn,
                    purpose_bengali=purpose,
                    safety_warnings_bengali=warnings,
                    missed_dose_advice_bengali="কোনো ডোজ ভুলে গেলে মনে পড়ার সাথে সাথে খেয়ে নিন। তবে পরবর্তী ডোজের সময় হয়ে গেলে একসাথে দুটি খাবেন না।",
                )
            )

        critical_notice = (
            "⚠️ জরুরি সতর্কতা: আপনার প্রেসক্রিপশনে কিছু সংবেদনশীল ওষুধের প্রভাব রয়েছে। কোনো ওষুধ নিজে নিজে পরিবর্তন বা অতিরিক্ত দিন চালাবেন না। যেকোনো জটিলতায় সাথে সাথে হাসপাতালে যোগাযোগ করুন।"
            if critical_alerts
            else "সব ওষুধ চিকিৎসকের নির্দেশিত মেয়াদে ও সঠিক সময়ে নিয়মমাফিক সেবন করুন।"
        )

        return BanglaPatientCompanionSchema(
            patient_name_bengali=patient.name or "সম্মানিত রোগী",
            patient_id=patient.patient_id or patient.id or "PRX-PATIENT",
            date_bengali=datetime.now().strftime("%d-%m-%Y"),
            overview_bengali=f"আপনার প্রেসক্রিপশনের মোট {len(medications)} টি ওষুধের সহজ নির্দেশনা নিচে দেওয়া হলো। চিকিৎসকের পরামর্শ ব্যতীত ওষুধ বন্ধ করবেন না।",
            medicines=med_cards,
            critical_safety_notice_bengali=critical_notice,
            emergency_instructions_bengali="যদি তীব্র পেট ব্যথা, কালো পায়খানা, শ্বাসকষ্ট বা শরীরে তীব্র অ্যালার্জি দেখা দেয়, তবে অবিলম্বে নিকটস্থ জরুরি বিভাগে যোগাযোগ করুন।",
            clinician_reviewed=False,
            reviewer_name=None,
        )
