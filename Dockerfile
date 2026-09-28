# Multi-stage Docker build for 100% free unified cloud hosting
FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy application files (backend contains pre-built production assets in backend/static)
COPY backend /app/backend

# Mirror static build into frontend/dist for dual-path resilience
RUN mkdir -p /app/frontend && cp -r /app/backend/static /app/frontend/dist

WORKDIR /app/backend

# Expose port and launch application
EXPOSE 8000

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
