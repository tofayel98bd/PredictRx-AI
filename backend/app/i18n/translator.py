"""Centralized Internationalization (i18n) Service for PredictRx-AI Backend."""

import json
from pathlib import Path
import re
from typing import Any, Dict, Optional, Tuple
from fastapi import Request

SUPPORTED_LANGUAGES = ("en", "bn")
DEFAULT_LANGUAGE = "en"


class SafeDict(dict):
    """Fallback dictionary for string formatting to prevent KeyError on missing tokens."""

    def __missing__(self, key: str) -> str:
        return f"{{{key}}}"


class Translator:
    """Manages bilingual localization dictionary, language resolution, and translation lookups."""

    _instance: Optional["Translator"] = None

    def __new__(cls) -> "Translator":
        if cls._instance is None:
            cls._instance = super(Translator, cls).__new__(cls)
            cls._instance._translations = {}
            cls._instance._load_locales()
        return cls._instance

    def _load_locales(self) -> None:
        locales_dir = Path(__file__).resolve().parent / "locales"
        for lang in SUPPORTED_LANGUAGES:
            file_path = locales_dir / f"{lang}.json"
            if file_path.exists():
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        self._translations[lang] = json.load(f)
                except Exception as exc:
                    self._translations[lang] = {}
            else:
                self._translations[lang] = {}

    def translate(self, key: str, lang: Optional[str] = None, **kwargs: Any) -> str:
        """
        Lookup a translation string using dot-notation (e.g. 'auth.invalid_credentials').
        Falls back to English if the key is missing in the requested language.
        Safely formats kwargs into placeholders.
        """
        selected_lang = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
        template = self._lookup_key(selected_lang, key)

        if template is None and selected_lang != DEFAULT_LANGUAGE:
            template = self._lookup_key(DEFAULT_LANGUAGE, key)

        if template is None:
            # If key not found in dictionaries, return the key itself
            return key

        if kwargs:
            try:
                return template.format_map(SafeDict(**kwargs))
            except Exception:
                return template
        return template

    def _lookup_key(self, lang: str, key: str) -> Optional[str]:
        parts = key.split(".")
        current = self._translations.get(lang, {})
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        return current if isinstance(current, str) else None

    def resolve_language(self, request: Optional[Request] = None, user: Optional[Any] = None) -> str:
        """
        Resolve language by explicit precedence:
        1. Explicit supported language preference for current request (query param or X-Language header).
        2. Accept-Language header.
        3. User's saved language preference (when authenticated).
        4. English fallback ('en').
        """
        if request is not None:
            # 1. Query parameters (?lang=bn or ?language=bn)
            query_lang = request.query_params.get("lang") or request.query_params.get("language")
            if query_lang:
                norm = query_lang.lower().strip()
                if norm in SUPPORTED_LANGUAGES:
                    return norm

            # 1b. Custom Header (X-Language: bn)
            x_lang = request.headers.get("x-language")
            if x_lang:
                norm = x_lang.lower().strip()
                if norm in SUPPORTED_LANGUAGES:
                    return norm

            # 2. Accept-Language header parsing (e.g., 'bn-BD,bn;q=0.9,en;q=0.8')
            accept_lang = request.headers.get("accept-language")
            if accept_lang:
                resolved = self._parse_accept_language(accept_lang)
                if resolved in SUPPORTED_LANGUAGES:
                    return resolved

        # 3. Authenticated user's saved preference
        if user is not None and getattr(user, "preferred_language", None):
            pref = getattr(user, "preferred_language").lower().strip()
            if pref in SUPPORTED_LANGUAGES:
                return pref

        # 4. English fallback
        return DEFAULT_LANGUAGE

    def _parse_accept_language(self, header: str) -> Optional[str]:
        """Parse RFC 2616 Accept-Language header with q-values."""
        # e.g., "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7"
        tags = []
        for part in header.split(","):
            part = part.strip()
            if not part:
                continue
            if ";q=" in part:
                tag, q_str = part.split(";q=", 1)
                try:
                    q = float(q_str.strip())
                except ValueError:
                    q = 1.0
            else:
                tag = part
                q = 1.0
            tag = tag.strip().lower()
            # Normalize 'bn-bd' -> 'bn', 'en-us' -> 'en'
            base_tag = tag.split("-")[0]
            tags.append((base_tag, q))

        # Sort tags by quality descending
        tags.sort(key=lambda x: x[1], reverse=True)

        for base_tag, _ in tags:
            if base_tag in SUPPORTED_LANGUAGES:
                return base_tag
        return None


# Global singleton instance
translator = Translator()
t = translator.translate
