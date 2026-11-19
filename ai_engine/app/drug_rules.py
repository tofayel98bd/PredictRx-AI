"""
Deterministic clinical safety rules and Bangladesh brand generic mappings.

CLINICAL SPECIFICATION:
Dosage ceilings and duration limits are calibrated against British National Formulary (BNF)
and Directorate General of Drug Administration (DGDA) clinical pharmacology guidelines.
"""
from __future__ import annotations

# Fallback brand -> generic (only well-known BD brands). Porag's DB is the source of truth.
BRAND_SEED = {
    "napa": "Paracetamol", "napa extend": "Paracetamol", "ace": "Paracetamol", "fast": "Paracetamol",
    "sergel": "Esomeprazole", "maxpro": "Esomeprazole",
    "seclo": "Omeprazole", "losectil": "Omeprazole", "pantodac": "Pantoprazole", "trupan": "Pantoprazole",
    "ecospirin": "Aspirin", "aspirin": "Aspirin", "aspirin cardio": "Aspirin",
    "rolac": "Ketorolac Tromethamine", "torax": "Ketorolac Tromethamine", "ketonic": "Ketorolac Tromethamine",
    "bizoran": "Amlodipine + Olmesartan", "camlosart": "Amlodipine + Olmesartan",
    "fexo": "Fexofenadine", "monas": "Montelukast", "zimax": "Azithromycin",
    "ciprocin": "Ciprofloxacin", "filmet": "Metronidazole",
    "lasix": "Furosemide", "fusid": "Furosemide",
    "ramiril": "Ramipril", "ramicard": "Ramipril", "ramipril": "Ramipril",
    "enalapril": "Enalapril", "renitec": "Enalapril", "vasotec": "Enalapril",
    "lisinopril": "Lisinopril", "inopril": "Lisinopril", "zestril": "Lisinopril",
    "losartan": "Losartan", "osartil": "Losartan", "angilock": "Losartan",
    "ultra-k": "Potassium", "potassium": "Potassium", "potassium supplements": "Potassium",
    "spironolactone": "Spironolactone", "aldactone": "Spironolactone", "spirolac": "Spironolactone",
    "warfarin": "Warfarin", "warf": "Warfarin",
    "clopidogrel": "Clopidogrel", "plagril": "Clopidogrel", "anclog": "Clopidogrel",
    "digoxin": "Digoxin", "methotrexate": "Methotrexate",
    "theopen": "Theophylline", "theophylline": "Theophylline",
    "comformin": "Metformin", "glucomin": "Metformin", "metformin": "Metformin",
    "atova": "Atorvastatin", "lipicon": "Atorvastatin", "atorvastatin": "Atorvastatin",
    "verapamil": "Verapamil", "diltiazem": "Diltiazem",
}

# key = lowercase generic substring. All fields optional.
#  max_duration_days : hard duration ceiling for the course
#  max_daily_mg      : adult max total mg/day (single-ingredient products only)
#  elderly_max_daily_mg : cap for age >= 65
#  min_age_years     : below this age -> CRITICAL
#  beers             : age >= 65 caution text (WARNING)
#  pregnancy         : "WARNING" (known teratogen) | "INFO" (avoid in pregnancy)
RULES = {
    "ketorolac":    dict(max_duration_days=5, max_daily_mg=40, elderly_max_daily_mg=40, min_age_years=16,
                         note="Ketorolac: total course (all routes) must not exceed 5 days; oral max 40 mg/day. "
                              "High GI-bleed and renal risk.",
                         beers="Ketorolac in elderly: high GI-bleed/AKI risk."),
    "paracetamol":  dict(max_daily_mg=4000, elderly_max_daily_mg=3000,
                         note="Paracetamol: adult max 4 g/day (3 g/day if elderly/low weight/liver disease)."),
    "aspirin":      dict(min_age_years=16, min_age_note="Aspirin under 16 years: risk of Reye's syndrome.",
                         max_daily_mg=4000),
    "ibuprofen":    dict(max_daily_mg=2400, beers="NSAID in elderly: GI-bleed, renal and CV risk."),
    "naproxen":     dict(max_daily_mg=1250, beers="NSAID in elderly: GI-bleed, renal and CV risk."),
    "diclofenac":   dict(max_daily_mg=150, beers="NSAID in elderly: GI-bleed, renal and CV risk."),
    "tramadol":     dict(max_daily_mg=400, elderly_max_daily_mg=300, min_age_years=12,
                         beers="Tramadol in elderly: confusion, falls, hyponatraemia."),
    "codeine":      dict(min_age_years=12),
    "ciprofloxacin": dict(min_age_years=18, min_age_note="Fluoroquinolones are generally avoided under 18 years.",
                          max_daily_mg=1500),
    "levofloxacin": dict(min_age_years=18, min_age_note="Fluoroquinolones are generally avoided under 18 years."),
    "doxycycline":  dict(min_age_years=8, min_age_note="Tetracyclines: tooth discolouration risk under 8 years."),
    "metronidazole": dict(max_duration_days=14, max_daily_mg=2400),
    "azithromycin": dict(max_duration_days=10, max_daily_mg=500),
    "alprazolam":   dict(max_duration_days=28, beers="Benzodiazepine in elderly: falls, cognitive impairment."),
    "diazepam":     dict(max_duration_days=28, beers="Benzodiazepine in elderly: falls, cognitive impairment."),
    "clonazepam":   dict(max_duration_days=28, beers="Benzodiazepine in elderly: falls, cognitive impairment."),
    "methotrexate": dict(pregnancy="WARNING", note="Narrow therapeutic index: avoid concurrent NSAIDs; monitor hematology."),
    "isotretinoin": dict(pregnancy="WARNING"),
    "warfarin":     dict(pregnancy="WARNING", note="High bleeding hazard: strict INR monitoring; avoid systemic NSAIDs."),
    "misoprostol":  dict(pregnancy="WARNING"),
    "olmesartan":   dict(pregnancy="INFO"),
    "losartan":     dict(pregnancy="INFO"),
    "telmisartan":  dict(pregnancy="INFO"),
    "enalapril":    dict(pregnancy="INFO", note="ACE inhibitor: avoid potassium supplements due to hyperkalemia hazard."),
    "lisinopril":   dict(pregnancy="INFO", note="ACE inhibitor: avoid potassium supplements due to hyperkalemia hazard."),
    "ramipril":     dict(pregnancy="INFO", note="ACE inhibitor: avoid potassium supplements due to hyperkalemia hazard."),
    "potassium":    dict(note="Avoid with ACE inhibitors, ARBs, or spironolactone due to fatal hyperkalemia risk."),
    "spironolactone": dict(pregnancy="WARNING", beers="Spironolactone in elderly: severe hyperkalemia if eGFR < 30.", note="Potassium-sparing diuretic: monitor serum potassium."),
    "digoxin":      dict(beers="Digoxin in elderly: narrow therapeutic window; risk of toxic arrhythmias.", max_daily_mg=0.25),
    "atorvastatin": dict(pregnancy="INFO"),
    "rosuvastatin": dict(pregnancy="INFO"),
    "simvastatin":  dict(pregnancy="INFO"),
}


def match_rule(generic: str | None):
    """Return list of (key, rule) whose key appears in the generic string."""
    if not generic:
        return []
    g = generic.lower()
    return [(k, r) for k, r in RULES.items() if k in g]
