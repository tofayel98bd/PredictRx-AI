"""
Deterministic safety rules + a small BD brand seed.

!! CLINICAL DISCLAIMER: values below are conservative, commonly-cited limits for a
hackathon prototype. Tahrima / a pharmacist must verify against BNF / DGDA before demo.
Porag's `bd_drugs_catalog` table should REPLACE BRAND_SEED and can override RULES
(max_daily_dose_mg, max_duration_days columns already exist in the schema).
"""
from __future__ import annotations

# Fallback brand -> generic (only well-known BD brands). Porag's DB is the source of truth.
BRAND_SEED = {
    "napa": "Paracetamol", "napa extend": "Paracetamol", "ace": "Paracetamol",
    "sergel": "Esomeprazole", "maxpro": "Esomeprazole",
    "seclo": "Omeprazole", "losectil": "Omeprazole",
    "ecospirin": "Aspirin", "rolac": "Ketorolac Tromethamine",
    "bizoran": "Amlodipine + Olmesartan", "fexo": "Fexofenadine",
    "monas": "Montelukast", "zimax": "Azithromycin",
    "ciprocin": "Ciprofloxacin", "filmet": "Metronidazole",
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
    "methotrexate": dict(pregnancy="WARNING"), "isotretinoin": dict(pregnancy="WARNING"),
    "warfarin":     dict(pregnancy="WARNING"), "misoprostol": dict(pregnancy="WARNING"),
    "olmesartan":   dict(pregnancy="INFO"), "losartan": dict(pregnancy="INFO"),
    "telmisartan":  dict(pregnancy="INFO"), "enalapril": dict(pregnancy="INFO"),
    "ramipril":     dict(pregnancy="INFO"), "atorvastatin": dict(pregnancy="INFO"),
    "rosuvastatin": dict(pregnancy="INFO"),
}


def match_rule(generic: str | None):
    """Return list of (key, rule) whose key appears in the generic string."""
    if not generic:
        return []
    g = generic.lower()
    return [(k, r) for k, r in RULES.items() if k in g]
