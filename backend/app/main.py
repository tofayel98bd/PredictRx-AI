"""PredictRx-AI FastAPI Application Entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.exceptions import (
    PredictRxException,
    generic_exception_handler,
    predict_rx_exception_handler,
    validation_exception_handler,
)
from app.core.logging import logger
from app.api.v1.router import api_router
from app.api.v1.endpoints import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure upload directory exists
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.PROJECT_VERSION} [{settings.ENVIRONMENT}]")
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Sync Vision LLM configuration to os.environ for ai_engine
    import os
    if settings.GEMINI_API_KEY and not os.getenv("GEMINI_API_KEY"):
        os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
    if settings.ANTHROPIC_API_KEY and not os.getenv("ANTHROPIC_API_KEY"):
        os.environ["ANTHROPIC_API_KEY"] = settings.ANTHROPIC_API_KEY
    if settings.LLM_PROVIDER and not os.getenv("LLM_PROVIDER"):
        os.environ["LLM_PROVIDER"] = settings.LLM_PROVIDER

    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=(
        "Production-oriented Clinical Decision Support System (CDSS) backend for prescription "
        "OCR analysis, Bangladesh medicine normalization, drug interaction checking, "
        "and explainable risk analysis."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Exception Handlers
app.add_exception_handler(PredictRxException, predict_rx_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Top-level direct health check for frontend convenience
app.include_router(health.router, tags=["Health"])

# Versioned API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root_status():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "status": "operational",
    }
