"""Vision LLM adapters. All return a validated RawPrescription."""
from __future__ import annotations
import base64, json, os
from typing import Protocol
from pydantic import ValidationError
from .schemas import RawPrescription

SYSTEM_PROMPT = """You are a meticulous pharmacy data-entry specialist reading Bangladeshi prescriptions
(handwritten or printed, English and/or Bangla).
RULES
1. Transcribe ONLY what is written. Never invent, complete or 'correct' a drug, dose or duration.
   If a field is not visible or unreadable, return null and lower `confidence`.
2. Bangladeshi dose pattern is morning+noon+night, e.g. '1+0+1', '১-০-১', '½+0+½'. Copy it exactly in `dosage_raw`.
   Latin abbreviations (OD, BD, TDS, QDS, HS, SOS, STAT) are also copied exactly.
3. Timing words: 'খাবার আগে/পরে', 'ac/pc', 'before/after meal' go in `timing_raw`.
4. Duration goes in `duration_raw` exactly as written ('14 days', '২ সপ্তাহ', '1 month', 'continue').
   A number written near a drug line that is a duration (e.g. 'x7') belongs here, not in strength.
5. Brand names are usually Bangladeshi brands (Napa, Sergel, Ecospirin, Bizoran, Rolac...). Keep strength with the
   brand if written together ('Sergel 20' -> brand 'Sergel', strength '20 mg' only if mg is implied by the product).
   Prefix words Tab./Cap./Syp./Inj. go in `form`.
6. `generic_name_guess`: fill ONLY if you are highly confident; otherwise null (a database resolves it later).
7. Ignore logos, doctor letterhead, ads, patient phone numbers. Do not output patient names.
8. One entry per medicine line, in the order written. Include injections, syrups, drops, creams.
9. confidence: 0.95+ clear print, 0.8 readable handwriting, <0.6 guessing. legibility: whole-image quality 0-1.
If the image is not a prescription set is_prescription=false and medicines=[]."""

USER_PROMPT = "Extract every medicine and the patient age/gender/weight (if written) from this prescription."

_MED = {
    "type": "object",
    "properties": {
        "brand_name": {"type": "string"}, "form": {"type": ["string", "null"]},
        "strength": {"type": ["string", "null"]}, "generic_name_guess": {"type": ["string", "null"]},
        "dosage_raw": {"type": ["string", "null"]}, "timing_raw": {"type": ["string", "null"]},
        "duration_raw": {"type": ["string", "null"]}, "instructions_raw": {"type": ["string", "null"]},
        "confidence": {"type": "number"},
    },
    "required": ["brand_name", "confidence"],
}
TOOL = {
    "name": "record_prescription",
    "description": "Record the structured contents of the prescription image.",
    "input_schema": {
        "type": "object",
        "properties": {
            "is_prescription": {"type": "boolean"}, "legibility": {"type": "number"},
            "doctor_name": {"type": ["string", "null"]}, "prescription_date": {"type": ["string", "null"]},
            "patient_age_years": {"type": ["number", "null"]}, "patient_gender": {"type": ["string", "null"]},
            "patient_weight_kg": {"type": ["number", "null"]}, "diagnosis_or_cc": {"type": ["string", "null"]},
            "medicines": {"type": "array", "items": _MED}, "notes": {"type": ["string", "null"]},
        },
        "required": ["is_prescription", "legibility", "medicines"],
    },
}


class Extractor(Protocol):
    def extract(self, image: bytes, media_type: str) -> RawPrescription: ...


class AnthropicExtractor:
    """Forced tool-use => always schema-shaped JSON (main reason for 95%+ valid output)."""
    def __init__(self, model: str | None = None, api_key: str | None = None, retries: int = 2):
        import anthropic
        self.client = anthropic.Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
        self.model = model or os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")
        self.retries = retries

    def extract(self, image: bytes, media_type: str) -> RawPrescription:
        last = None
        for _ in range(self.retries + 1):
            resp = self.client.messages.create(
                model=self.model, max_tokens=4000, temperature=0, system=SYSTEM_PROMPT,
                tools=[TOOL], tool_choice={"type": "tool", "name": "record_prescription"},
                messages=[{"role": "user", "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type,
                                                  "data": base64.b64encode(image).decode()}},
                    {"type": "text", "text": USER_PROMPT}]}])
            block = next((b for b in resp.content if b.type == "tool_use"), None)
            try:
                return RawPrescription.model_validate(block.input)
            except (ValidationError, AttributeError) as e:
                last = e
        raise RuntimeError(f"Vision extraction failed schema validation after retries: {last}")


class GeminiExtractor:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        from google import genai
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise RuntimeError("GEMINI_API_KEY not set")
        self.client = genai.Client(api_key=key)
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
        self.fallback_models = [
            self.model,
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.7-flash",
            "gemini-3.8-flash",
        ]

    def extract(self, image_bytes: bytes, media_type: str = "image/jpeg") -> RawPrescription:
        from google.genai import types
        part = types.Part.from_bytes(data=image_bytes, mime_type=media_type)
        last_err = None
        seen = set()

        for m in self.fallback_models:
            if m in seen:
                continue
            seen.add(m)
            try:
                print(f"[ Gemini ] Trying model: {m} ...")
                resp = self.client.models.generate_content(
                    model=m,
                    contents=[part, USER_PROMPT],
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.0,
                        response_mime_type="application/json",
                        response_schema=RawPrescription,
                    ),
                )
                print(f"[ Gemini ] Success with model: {m}!")
                return RawPrescription.model_validate_json(resp.text)
            except Exception as e:
                last_err = e
                print(f"[ Warning ] Model '{m}' busy or failed ({type(e).__name__}), switching to next fallback model...")
                continue

        raise RuntimeError(f"All Gemini fallback models failed. Last error: {last_err}")


class MockExtractor:
    """Offline testing / demo fallback: returns a fixed RawPrescription."""
    def __init__(self, fixture: RawPrescription):
        self.fixture = fixture

    def extract(self, image: bytes, media_type: str) -> RawPrescription:
        return self.fixture.model_copy(deep=True)


def get_extractor(provider: str | None = None) -> Extractor:
    from dotenv import load_dotenv
    load_dotenv()
    if not provider:
        provider = os.getenv("LLM_PROVIDER")
        if not provider:
            if os.getenv("GEMINI_API_KEY"):
                provider = "gemini"
            elif os.getenv("ANTHROPIC_API_KEY"):
                provider = "anthropic"
            else:
                provider = "gemini"
    return GeminiExtractor() if provider.lower() == "gemini" else AnthropicExtractor()
