"""Database session management and engine configuration with auto-fallback."""

import os
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("app.db.session")


def _init_sqlite_tables(eng):
    import app.models  # Register all models with Base.metadata
    from app.db.base import Base
    Base.metadata.create_all(eng)


def _init_engine():
    if os.getenv("USE_SQLITE", "false").lower() in ("true", "1") or settings.ENVIRONMENT == "test":
        db_path = Path(__file__).resolve().parents[2] / "predictrx.db"
        logger.info(f"Using SQLite database engine at {db_path}")
        eng = create_engine(
            f"sqlite:///{db_path}",
            connect_args={"check_same_thread": False},
            echo=False,
        )
        _init_sqlite_tables(eng)
        return eng

    try:
        eng = create_engine(
            settings.SQLALCHEMY_DATABASE_URI,
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
            connect_args={"connect_timeout": 2},
        )
        with eng.connect() as conn:
            pass
        return eng
    except Exception as exc:
        db_path = Path(__file__).resolve().parents[2] / "predictrx.db"
        logger.warning(
            f"PostgreSQL at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT} unavailable ({exc}). "
            f"Falling back to local SQLite engine: {db_path}"
        )
        eng = create_engine(
            f"sqlite:///{db_path}",
            connect_args={"check_same_thread": False},
            echo=False,
        )
        _init_sqlite_tables(eng)
        return eng


engine = _init_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a SQLAlchemy session and ensures clean closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> dict:
    """Diagnostic check for database connectivity and latency."""
    try:
        with engine.connect() as conn:
            if engine.dialect.name == "sqlite":
                return {
                    "status": "healthy",
                    "database": "sqlite_local",
                    "version": "SQLite 3",
                    "is_replica": False,
                }
            result = conn.execute(text("SELECT version(), current_database(), pg_is_in_recovery()"))
            row = result.fetchone()
            return {
                "status": "healthy",
                "database": row[1] if row else "unknown",
                "version": row[0].split(",")[0] if row else "unknown",
                "is_replica": row[2] if row else False,
            }
    except Exception as exc:
        logger.error("Database health check failed", exc_info=exc)
        return {
            "status": "unhealthy",
            "error": str(exc),
        }
