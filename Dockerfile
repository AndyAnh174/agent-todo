FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# System deps (optional): none required for psycopg2-binary
RUN pip install --upgrade pip

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY . .

# Entrypoint will run alembic upgrade then start uvicorn
RUN chmod +x server/scripts/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "server/scripts/entrypoint.sh"]


