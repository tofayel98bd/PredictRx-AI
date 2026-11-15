"""Database session management and engine configuration."""

from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("app.db.session")

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

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
    """Diagnostic check for PostgreSQL connectivity and latency."""
    try:
        with engine.connect() as conn:
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
