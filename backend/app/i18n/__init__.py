"""PredictRx-AI Internationalization (i18n) Package."""

from app.i18n.translator import (
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    Translator,
    t,
    translator,
)

__all__ = [
    "DEFAULT_LANGUAGE",
    "SUPPORTED_LANGUAGES",
    "Translator",
    "t",
    "translator",
]
