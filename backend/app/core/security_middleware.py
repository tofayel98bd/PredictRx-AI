"""OWASP Security Headers, Request-ID Traceability, and Sliding-Window Rate Limiter."""

from collections import defaultdict, deque
import threading
import time
from typing import Callable, Deque, Dict, Optional, Tuple
import uuid
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("app.security")


class SlidingWindowRateLimiter:
    """Thread-safe, memory-bounded in-process sliding-window rate limiter."""

    def __init__(self) -> None:
        self._buckets: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()
        self._last_prune = time.monotonic()

    def is_allowed(self, key: str, limit: int, window_seconds: int) -> Tuple[bool, int]:
        """Check and record a request. Returns (allowed, retry_after_seconds)."""
        now = time.monotonic()
        cutoff = now - window_seconds

        with self._lock:
            bucket = self._buckets[key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= limit:
                retry_after = max(1, int(bucket[0] + window_seconds - now) + 1)
                return False, retry_after

            bucket.append(now)

            # Periodic memory pruning to prevent unbounded growth under IP spray
            if now - self._last_prune > 300:
                stale_keys = [k for k, dq in self._buckets.items() if not dq or dq[-1] <= cutoff]
                for k in stale_keys:
                    del self._buckets[k]
                self._last_prune = now

            return True, 0

    def reset(self) -> None:
        """Clear all rate-limit buckets (used by automated tests)."""
        with self._lock:
            self._buckets.clear()


rate_limiter = SlidingWindowRateLimiter()


def _resolve_rate_policy(path: str) -> Optional[Tuple[str, int, int]]:
    """Return (bucket_name, max_requests, window_seconds) for sensitive endpoints."""
    if path.endswith("/auth/login") or path.endswith("/auth/register"):
        return ("auth", settings.RATE_LIMIT_AUTH_PER_MIN, 60)
    if path.endswith("/predict-rx/analyze") or path.endswith("/predict-rx/tts"):
        return ("ai_cdss", settings.RATE_LIMIT_AI_PER_MIN, 60)
    return None


class SecurityHeadersAndTraceMiddleware(BaseHTTPMiddleware):
    """Inject OWASP security headers, X-Request-ID tracing, and rate limiting."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        req_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        request.state.request_id = req_id
        t0 = time.perf_counter()

        # Apply sliding-window rate limit on sensitive endpoints when enabled
        if settings.RATE_LIMIT_ENABLED and request.method != "OPTIONS":
            policy = _resolve_rate_policy(request.url.path)
            if policy:
                bucket_name, limit, window_s = policy
                client_ip = (
                    request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                    or (request.client.host if request.client else "unknown")
                )
                allowed, retry_after = rate_limiter.is_allowed(f"{bucket_name}:{client_ip}", limit, window_s)
                if not allowed:
                    logger.warning("Rate limit exceeded [%s] ip=%s req_id=%s", bucket_name, client_ip, req_id)
                    return JSONResponse(
                        status_code=429,
                        content={
                            "error": "RATE_LIMIT_EXCEEDED",
                            "message": "Too many requests. Please wait before retrying.",
                            "retry_after_seconds": retry_after,
                            "request_id": req_id,
                        },
                        headers={"Retry-After": str(retry_after), "X-Request-ID": req_id},
                    )

        response = await call_next(request)
        latency_ms = int((time.perf_counter() - t0) * 1000)

        # OWASP Security Headers
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["X-XSS-Protection"] = "0"
        if "/auth/" in request.url.path:
            response.headers["Cache-Control"] = "no-store"
        if settings.ENVIRONMENT.lower() == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        logger.info("%s %s -> %d (%dms) req_id=%s", request.method, request.url.path, response.status_code, latency_ms, req_id)
        return response
