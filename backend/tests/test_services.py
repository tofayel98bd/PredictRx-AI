"""Unit tests for core clinical services and parsing algorithms."""

from app.schemas.analysis import PatientContextSchema, ValidatedMedicineSchema
from app.services.bangla_companion_service import BanglaCompanionService
from app.services.drug_normalization_service import DrugNormalizationService
from app.services.interaction_service import InteractionService
from app.services.prescription_syntax_service import PrescriptionSyntaxService


def test_syntax_service_bangla_digits():
    service = PrescriptionSyntaxService()
    parsed = service.parse_dosage("১+০+১")
    assert parsed.status == "slots"
    assert parsed.normalized == "1+0+1"
    assert parsed.per_day == 2.0


def test_syntax_service_spoon_syrup():
    service = PrescriptionSyntaxService()
    parsed = service.parse_dosage("২ চামচ x ৩ বার")
    assert parsed.status == "slots"
    assert parsed.per_day == 6.0


def test_syntax_service_latin_abbreviations():
    service = PrescriptionSyntaxService()
    assert service.parse_dosage("TDS").per_day == 3.0
    assert service.parse_dosage("BD").per_day == 2.0
    assert service.parse_dosage("OD").per_day == 1.0
    assert service.parse_dosage("SOS").status == "prn"


def test_syntax_service_duration_parsing():
    service = PrescriptionSyntaxService()
    days, text = service.parse_duration_days("14 days")
    assert days == 14

    days, text = service.parse_duration_days("২ সপ্তাহ")
    assert days == 14

    days, text = service.parse_duration_days("1 month")
    assert days == 30


def test_drug_normalization(db_session):
    service = DrugNormalizationService(db_session)
    # Test brand Napa
    res1 = service.normalize("Tab. Napa Extend 665mg")
    assert res1.is_matched is True
    assert res1.generic_name == "Paracetamol"

    # Test brand Rolac
    res2 = service.normalize("Rolac")
    assert res2.is_matched is True
    assert "Ketorolac" in (res2.generic_name or "")

    # Test brand Bizoran
    res3 = service.normalize("Bizoran")
    assert res3.is_matched is True
    assert "Olmesartan" in (res3.generic_name or "")


def test_interaction_triple_whammy(db_session):
    service = InteractionService(db_session)
    results = service.evaluate_interactions(["Ramipril", "Furosemide", "Ketorolac Tromethamine"])
    assert len(results) >= 2
    # Verify Triple Whammy presence
    assert any("Triple Whammy" in r.mechanism for r in results)


def test_bangla_companion_translation():
    service = BanglaCompanionService()
    patient = PatientContextSchema(name="রহিম মিয়া", age=55)
    meds = [
        ValidatedMedicineSchema(
            brand_name="Napa Extend 665mg",
            generic_name="Paracetamol",
            dosage_syntax="1+0+1",
            timing="After Meal",
            duration_days=7,
        )
    ]
    companion = service.generate(patient, meds)
    assert len(companion.medicines) == 1
    assert "সকালে ১টি ও রাতে ১টি" == companion.medicines[0].dosage_bengali
    assert "খাবার পরে ভরা পেটে খাবেন" == companion.medicines[0].timing_bengali
