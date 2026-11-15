FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy Alembic migrations and application source
COPY alembic.ini .
COPY alembic/ ./alembic/
COPY app/ ./app/

# Create upload directory
RUN mkdir -p uploads

# Expose API port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run database migrations, initial master seeding, and start production Uvicorn server
CMD ["sh", "-c", "alembic upgrade head && python -m app.db.init_db && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
