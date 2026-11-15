"""Structured application logging with privacy safeguards."""

import logging
import sys
from typing import Any


class PrivacyFilter(logging.Filter):
    """Filter that prevents accidental logging of passwords or tokens."""

    SENSITIVE_KEYS = {"password", "token", "secret", "authorization", "hashed_password"}

    def filter(self, record: logging.LogRecord) -> bool:
        # Basic check to avoid logging sensitive arguments in string representations
        msg = str(record.msg).lower()
        for key in self.SENSITIVE_KEYS:
            if f'"{key}"' in msg or f"'{key}'" in msg:
                record.msg = "[REDACTED SENSITIVE DATA]"
                break
        return True


def setup_logging() -> logging.Logger:
    logger = logging.getLogger("predictrx")
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        handler.addFilter(PrivacyFilter())
        logger.addHandler(handler)
    return logger


def get_logger(name: str = "predictrx") -> logging.Logger:
    """Return a logger instance with privacy-filtering handlers configured."""
    setup_logging()
    return logging.getLogger(name)


logger = setup_logging()
