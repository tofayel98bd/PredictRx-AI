"""Vision LLM adapters with resilient retries, backoff, and multi-provider failover."""
from __future__ import annotations

import base64
import logging
import os
import random
import time
from typing import List, Optional, Protocol, Tuple
from pydantic import ValidationError

from .prompts import PROMPT_VERSION, SYSTEM_PROMPT, USER_PROMPT
from .schemas import RawPrescription

logger = logging.getLogger("ai_engine.extractor")

_MED = {
    "type": "object",
    "properties": {
        "brand_name": {"type": "string"},
        "form": {"type": ["string", "null"]},
        "strength": {"type": ["string", "null"]},
        "generic_name_guess": {"type": ["string", "null"]},
        "dosage_raw": {"type": ["string", "null"]},
        "timing_raw": {"type": ["string", "null"]},
        "duration_raw": {"type": ["string", "null"]},
        "instructions_raw": {"type": ["string", "null"]},
        "confidence": {"type": "number"},
    },
    "required": ["brand_name", "confidence"],
}

TOOL = {
    "name": "record_prescription",
    "description": "Record the structured contents of the prescription image or PDF.",
    "input_schema": {
        "type": "object",
        "properties": {
            "is_prescription": {"type": "boolean"},
            "legibility": {"type": "number"},
            "doctor_name": {"type": ["string", "null"]},
            "prescription_date": {"type": ["string", "null"]},
            "patient_name": {"type": ["string", "null"]},
            "patient_age_years": {"type": ["number", "null"]},
            "patient_gender": {"type": ["string", "null"]},
            "patient_weight_kg": {"type": ["number", "null"]},
            "systolic_bp": {"type": ["integer", "null"]},
            "diastolic_bp": {"type": ["integer", "null"]},
            "creatinine_mg_dl": {"type": ["number", "null"]},
            "egfr": {"type": ["number", "null"]},
            "hba1c": {"type": ["number", "null"]},
            "allergies": {"type": "array", "items": {"type": "string"}},
            "diagnosis_or_cc": {"type": ["string", "null"]},
            "medicines": {"type": "array", "items": _MED},
            "notes": {"type": ["string", "null"]},
        },
        "required": ["is_prescription", "legibility", "medicines"],
    },
}


def _is_permanent_auth_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(
        tok in msg
        for tok in (
            "api_key_invalid",
            "api key not valid",
            "invalid api key",
            "authentication_error",
            "unauthenticated",
            "401",
            "403",
            "permission_denied",
        )
    )


def _is_transient_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(
        tok in msg
        for tok in ("429", "resource_exhausted", "rate limit", "503", "502", "504", "timeout", "timed out", "temporarily", "unavailable")
    )


def _backoff_sleep(attempt: int, base: float = 0.35) -> None:
    delay = base * (2 ** attempt) + random.uniform(0.0, 0.15)
    time.sleep(delay)


class Extractor(Protocol):
    def extract(self, image: bytes, media_type: str) -> RawPrescription: ...


class AnthropicExtractor:
    """Forced tool-use => schema-shaped JSON for images and PDFs with exponential backoff."""

    def __init__(
        self,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        retries: int = 2,
        timeout_seconds: float = 35.0,
    ):
        import anthropic

        key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")
        self.client = anthropic.Anthropic(api_key=key, timeout=timeout_seconds)
        self.model = model or os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5")
        self.retries = retries
        self.last_model_used: Optional[str] = self.model
        self.last_provider_used: str = "anthropic"

    def extract(self, image: bytes, media_type: str = "image/jpeg") -> RawPrescription:
        last: Optional[Exception] = None
        encoded = base64.b64encode(image).decode()
        if media_type == "application/pdf":
            media_block = {
                "type": "document",
                "source": {"type": "base64", "media_type": "application/pdf", "data": encoded},
            }
        else:
            media_block = {
                "type": "image",
                "source": {"type": "base64", "media_type": media_type, "data": encoded},
            }

        for attempt in range(self.retries + 1):
            try:
                resp = self.client.messages.create(
                    model=self.model,
                    max_tokens=4000,
                    temperature=0,
                    system=SYSTEM_PROMPT,
                    tools=[TOOL],
                    tool_choice={"type": "tool", "name": "record_prescription"},
                    messages=[{"role": "user", "content": [media_block, {"type": "text", "text": USER_PROMPT}]}],
                )
                block = next((b for b in resp.content if b.type == "tool_use"), None)
                if block is None:
                    raise ValidationError.from_exception_data("RawPrescription", [])
                parsed = RawPrescription.model_validate(block.input)
                self.last_model_used = self.model
                self.last_provider_used = "anthropic"
                return parsed
            except Exception as exc:
                last = exc
                if _is_permanent_auth_error(exc):
                    logger.error("Anthropic auth failure (%s): aborting retries.", type(exc).__name__)
                    raise
                if attempt < self.retries and (_is_transient_error(exc) or isinstance(exc, (ValidationError, AttributeError))):
                    logger.warning("Anthropic attempt %d failed (%s); retrying with backoff.", attempt + 1, type(exc).__name__)
                    _backoff_sleep(attempt)
                    continue
                break
        raise RuntimeError(f"Anthropic vision extraction failed after retries: {last}")


class GeminiExtractor:
    """Gemini Vision extractor with ordered model fallback and transient backoff."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        retries_per_model: int = 1,
    ):
        from google import genai

        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise RuntimeError("GEMINI_API_KEY not set")
        self.client = genai.Client(api_key=key)
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.retries_per_model = retries_per_model
        self.fallback_models = [
            self.model,
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash",
            "gemini-3.8-flash",
            "gemini-3.5-flash-lite",
        ]
        self.last_model_used: Optional[str] = None
        self.last_provider_used: str = "gemini"

    def extract(self, image_bytes: bytes, media_type: str = "image/jpeg") -> RawPrescription:
        from google.genai import types

        part = types.Part.from_bytes(data=image_bytes, mime_type=media_type)
        last_err: Optional[Exception] = None
        seen = set()

        for m in self.fallback_models:
            if not m or m in seen:
                continue
            seen.add(m)
            for attempt in range(self.retries_per_model + 1):
                try:
                    logger.info("Gemini extraction trying model=%s (attempt=%d, prompt=%s)", m, attempt + 1, PROMPT_VERSION)
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
                    parsed = RawPrescription.model_validate_json(resp.text)
                    self.last_model_used = m
                    self.last_provider_used = "gemini"
                    logger.info("Gemini extraction succeeded with model=%s (%d meds)", m, len(parsed.medicines))
                    return parsed
                except Exception as exc:
                    last_err = exc
                    if _is_permanent_auth_error(exc):
                        logger.error("Gemini permanent auth error on model=%s: %s", m, type(exc).__name__)
                        raise
                    if attempt < self.retries_per_model and _is_transient_error(exc):
                        logger.warning("Gemini transient error on model=%s (%s); backing off.", m, type(exc).__name__)
                        _backoff_sleep(attempt)
                        continue
                    logger.warning("Gemini model=%s unavailable (%s); trying next fallback.", m, type(exc).__name__)
                    break

        raise RuntimeError(f"All Gemini fallback models failed. Last error: {last_err}")


class ResilientExtractor:
    """Failover wrapper across ordered Vision providers (e.g. Gemini -> Anthropic)."""

    def __init__(self, providers: List[Tuple[str, Extractor]]):
        if not providers:
            raise RuntimeError("No Vision LLM providers configured.")
        self.providers = providers
        self.last_provider_used: Optional[str] = None
        self.last_model_used: Optional[str] = None

    def extract(self, image: bytes, media_type: str = "image/jpeg") -> RawPrescription:
        errors: List[str] = []
        for provider_name, ext in self.providers:
            try:
                res = ext.extract(image, media_type)
                self.last_provider_used = getattr(ext, "last_provider_used", provider_name)
                self.last_model_used = getattr(ext, "last_model_used", None)
                return res
            except Exception as exc:
                logger.warning("Vision provider '%s' failed (%s); checking next provider.", provider_name, type(exc).__name__)
                errors.append(f"{provider_name}: {exc}")
        raise RuntimeError(" | ".join(errors))


class MockExtractor:
    """Offline testing / demo fallback: returns a fixed RawPrescription."""

    def __init__(self, fixture: RawPrescription):
        self.fixture = fixture
        self.last_provider_used = "mock"
        self.last_model_used = "mock-fixture"

    def extract(self, image: bytes, media_type: str = "image/jpeg") -> RawPrescription:
        return self.fixture.model_copy(deep=True)


def get_extractor(provider: Optional[str] = None) -> Extractor:
    from dotenv import load_dotenv

    load_dotenv()
    has_gemini = bool(os.getenv("GEMINI_API_KEY"))
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))

    preferred = (provider or os.getenv("LLM_PROVIDER") or ("gemini" if has_gemini else "anthropic")).lower()
    ordered: List[Tuple[str, Extractor]] = []

    def _try_add_gemini() -> None:
        if has_gemini:
            ordered.append(("gemini", GeminiExtractor()))

    def _try_add_anthropic() -> None:
        if has_anthropic:
            ordered.append(("anthropic", AnthropicExtractor()))

    if preferred == "anthropic":
        _try_add_anthropic()
        _try_add_gemini()
    else:
        _try_add_gemini()
        _try_add_anthropic()

    if not ordered:
        # Preserve original error behavior if no API keys are configured
        if preferred == "anthropic":
            return AnthropicExtractor()
        return GeminiExtractor()

    if len(ordered) == 1:
        return ordered[0][1]
    return ResilientExtractor(ordered)
