#!/bin/sh

# Wait for Redis
echo "Waiting for Redis..."
until redis-cli -h redis ping; do
  echo "Redis not ready, retrying..."
  sleep 2
done

# Wait for DB
if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for database..."
  ATTEMPTS=0
  until python - <<'PY'
import os
import sys
import time
from sqlalchemy import create_engine, text

url=os.getenv('DATABASE_URL')
try:
    e=create_engine(url, future=True)
    with e.connect() as conn:
        conn.execute(text("SELECT 1"))
    sys.exit(0)
except Exception as e:
    sys.exit(1)
PY
  do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ "$ATTEMPTS" -gt 30 ]; then
      echo "Database not ready after 30 attempts"
      exit 1
    fi
    echo "DB not ready, retrying... ($ATTEMPTS)"
    sleep 2
  done
fi

# Start Celery worker
exec celery -A app.celery_app worker -l info --pool=solo
